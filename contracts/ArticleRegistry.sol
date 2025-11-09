//ArticleRegistry.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./ValidatorStaking.sol";

/// @title Article Registry with staking rewards/penalties
/// @notice Stores article submissions, AI trust scores, validator votes, and rewards/slashes validators.
contract ArticleRegistry is AccessControl {
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant AI_ROLE = keccak256("AI_ROLE"); // service that sets AI scores

    // simple counter (avoid Counters library to maintain compatibility)
    uint256 private _articleIds;

    // staking contract that holds staked balances and offers reward/slash operations
    ValidatorStaking public stakingContract;

    uint256 public constant REWARD_AMOUNT = 10 * 1e18; // 10 NEWS tokens
    uint256 public constant PENALTY_AMOUNT = 5 * 1e18; // 5 NEWS tokens

    enum Status {
        Submitted,        // 0
        AIApproved,       // 1
        UnderReview,      // 2
        ValidatorApproved,// 3  (optional)
        Rejected,         // 4
        Published         // 5
    }

    struct ArticleVersion {
        string ipfsCid;
        bytes32 contentHash;
        uint256 timestamp;
    }

    struct Article {
        uint256 id;
        address author;
        ArticleVersion[] versions;
        uint256 trustScore; // 0–100
        Status status;
        uint256 yesVotes;
        uint256 noVotes;
        mapping(address => bool) hasVoted;        // prevented double-vote
        mapping(address => bool) voteDecision;    // true => yes, false => no
        EnumerableSet.AddressSet validators;      // set of validators who voted
        uint256 nextProposalId; // To track unique proposal IDs for this article
    }

    struct ArticleUpdateProposal {
        uint256 articleId;
        uint256 proposalId;
        string newIpfsCid;
        bytes32 newContentHash;
        address proposer;
        uint256 yesVotes;
        uint256 noVotes;
        mapping(address => bool) hasVoted; // Prevent double-voting on this proposal
        mapping(address => bool) voteDecision; // true for yes, false for no
        EnumerableSet.AddressSet voters; // Set of validators who voted on this proposal
        Status status; // e.g., UnderReview, Approved, Rejected
        uint256 createdAt;
    }

    mapping(uint256 => Article) private articles;
    mapping(uint256 => mapping(uint256 => ArticleUpdateProposal)) private articleUpdateProposals; // articleId => proposalId => proposal

    event ArticleSubmitted(uint256 indexed id, address indexed author, string ipfsCid, bytes32 hash, uint256 version);
    event AIScored(uint256 indexed id, uint256 trustScore, Status status);
    event Voted(uint256 indexed id, address indexed validator, bool decision);
    event ArticleFinalized(uint256 indexed id, Status status);
    event ArticleUpdateProposed(uint256 indexed articleId, uint256 indexed proposalId, address indexed proposer, string newIpfsCid, bytes32 newContentHash);
    event ArticleUpdateVoted(uint256 indexed articleId, uint256 indexed proposalId, address indexed voter, bool decision);
    event ArticleUpdateFinalized(uint256 indexed articleId, uint256 indexed proposalId, Status status, string newIpfsCid, bytes32 newContentHash);

    struct UpdateProposal {
        uint256 newRewardAmount;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => UpdateProposal) private updateProposals;

    event UpdateProposed(uint256 indexed version, address indexed proposer, uint256 newRewardAmount);
    event UpdateVoted(uint256 indexed version, address indexed voter, bool vote);
    event UpdateExecuted(uint256 indexed version, uint256 newRewardAmount);


    constructor(address stakingAddress) {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(ADMIN_ROLE, msg.sender);
    stakingContract = ValidatorStaking(stakingAddress);
    }


    /// @notice Submit a new article
    function submitArticle(string calldata ipfsCid, bytes32 contentHash) external returns (uint256) {
        _articleIds++;
        uint256 newId = _articleIds;

        Article storage a = articles[newId];
        a.id = newId;
        a.author = msg.sender;
        a.status = Status.Submitted;
        a.nextProposalId = 1; // Initialize proposal ID counter

        // Create the first version of the article
        a.versions.push(ArticleVersion({
            ipfsCid: ipfsCid,
            contentHash: contentHash,
            timestamp: block.timestamp
        }));

        emit ArticleSubmitted(newId, msg.sender, ipfsCid, contentHash, 0);
        return newId;
    }

    /// @notice Propose an update to an existing article (only author of published article)
    function proposeArticleUpdate(uint256 articleId, string calldata newIpfsCid, bytes32 newContentHash) external {
        Article storage a = articles[articleId];
        require(a.id != 0, "Article not found");
        require(a.author == msg.sender, "Only author can propose updates");
        require(a.status == Status.Published, "Article must be published to propose an update");

        // Check if there's a pending proposal (status == UnderReview)
        uint256 currentProposalId = a.nextProposalId;
        if (currentProposalId > 1) {
            ArticleUpdateProposal storage previousProposal = articleUpdateProposals[articleId][currentProposalId - 1];
            require(previousProposal.status != Status.UnderReview, "Pending update proposal already exists");
        }

        uint256 proposalId = a.nextProposalId;
        a.nextProposalId++;

        ArticleUpdateProposal storage proposal = articleUpdateProposals[articleId][proposalId];
        proposal.articleId = articleId;
        proposal.proposalId = proposalId;
        proposal.newIpfsCid = newIpfsCid;
        proposal.newContentHash = newContentHash;
        proposal.proposer = msg.sender;
        proposal.status = Status.Submitted; // Start as Submitted, awaits AI scoring
        proposal.createdAt = block.timestamp;

        emit ArticleUpdateProposed(articleId, proposalId, msg.sender, newIpfsCid, newContentHash);
    }

    /// @notice Set AI trust score for an update proposal (only AI_ROLE)
    function setUpdateProposalAIScore(uint256 articleId, uint256 proposalId, uint256 trustScore) external onlyRole(AI_ROLE) {
        require(trustScore <= 100, "Invalid score");
        ArticleUpdateProposal storage proposal = articleUpdateProposals[articleId][proposalId];
        require(proposal.createdAt != 0, "Proposal not found");
        require(proposal.status == Status.Submitted, "Proposal already scored");

        if (trustScore >= 80) {
            // Auto-approve: create new version immediately
            _finalizeUpdateProposal(articleId, proposalId, Status.Published);
        } else {
            // Send to validator review
            proposal.status = Status.UnderReview;
            emit AIScored(articleId, trustScore, Status.UnderReview);
        }
    }

    /// @notice Validators vote on article update proposals
    function voteOnUpdateProposal(uint256 articleId, uint256 proposalId, bool decision) external {
        ArticleUpdateProposal storage proposal = articleUpdateProposals[articleId][proposalId];
        require(proposal.createdAt != 0, "Proposal not found");
        require(proposal.status == Status.UnderReview, "Not under review");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        // Require minimum stake
        require(stakingContract.stakedBalance(msg.sender) >= stakingContract.MIN_STAKE(), "Must stake at least 100 NEWS tokens");

        proposal.hasVoted[msg.sender] = true;
        proposal.voteDecision[msg.sender] = decision;
        proposal.voters.add(msg.sender);

        if (decision) {
            unchecked { proposal.yesVotes += 1; }
        } else {
            unchecked { proposal.noVotes += 1; }
        }

        emit ArticleUpdateVoted(articleId, proposalId, msg.sender, decision);

        // Check if consensus reached (>=80% yes out of total votes)
        uint256 totalVotes = proposal.yesVotes + proposal.noVotes;
        if (totalVotes >= 5) { // minimum votes threshold
            uint256 yesPercent = (proposal.yesVotes * 100) / totalVotes;
            if (yesPercent >= 80) {
                _finalizeUpdateProposal(articleId, proposalId, Status.Published);
            } else {
                _finalizeUpdateProposal(articleId, proposalId, Status.Rejected);
            }
        }
    }

    /// @notice Internal finalize for update proposals: create new version if approved
    function _finalizeUpdateProposal(uint256 articleId, uint256 proposalId, Status status) internal {
        ArticleUpdateProposal storage proposal = articleUpdateProposals[articleId][proposalId];
        Article storage a = articles[articleId];

        proposal.status = status;

        if (status == Status.Published) {
            // Create new version
            a.versions.push(ArticleVersion({
                ipfsCid: proposal.newIpfsCid,
                contentHash: proposal.newContentHash,
                timestamp: block.timestamp
            }));

            emit ArticleSubmitted(articleId, a.author, proposal.newIpfsCid, proposal.newContentHash, a.versions.length - 1);
        }

        // Reward/punish validators who voted
        uint256 len = proposal.voters.length();
        for (uint256 i = 0; i < len; i++) {
            address v = proposal.voters.at(i);
            bool votedYes = proposal.voteDecision[v];

            if ((status == Status.Published && votedYes) || (status == Status.Rejected && !votedYes)) {
                stakingContract.rewardValidator(v, REWARD_AMOUNT);
            } else {
                stakingContract.slashValidator(v, PENALTY_AMOUNT);
            }
        }

        emit ArticleUpdateFinalized(articleId, proposalId, status, proposal.newIpfsCid, proposal.newContentHash);
    }

    /// @notice Set AI trust score (only AI_ROLE)
    function setAIScore(uint256 articleId, uint256 trustScore) external onlyRole(AI_ROLE) {
        require(trustScore <= 100, "Invalid score");
        Article storage a = articles[articleId];
        require(a.id != 0, "Article not found");
        require(a.status == Status.Submitted, "Already scored");

        a.trustScore = trustScore;

        if (trustScore >= 80) {
            a.status = Status.AIApproved;
            emit AIScored(articleId, trustScore, Status.AIApproved);
            _finalize(articleId, Status.Published);
        } else {
            a.status = Status.UnderReview;
            emit AIScored(articleId, trustScore, Status.UnderReview);
        }
    }

    /// @notice Validators vote on under-review articles
    function vote(uint256 articleId, bool decision) external {
        Article storage a = articles[articleId];
        require(a.id != 0, "Article not found");
        require(a.status == Status.UnderReview, "Not under review");
        require(!a.hasVoted[msg.sender], "Already voted");

        // Require the voter has minimum stake
        require(stakingContract.stakedBalance(msg.sender) >= stakingContract.MIN_STAKE(), "Must stake at least 100 NEWS tokens");

        a.hasVoted[msg.sender] = true;
        a.voteDecision[msg.sender] = decision;
        a.validators.add(msg.sender);

        if (decision) {
            unchecked { a.yesVotes += 1; }
        } else {
            unchecked { a.noVotes += 1; }
        }

        emit Voted(articleId, msg.sender, decision);

        // Check if consensus reached (>=80% yes out of total votes)
        uint256 totalVotes = a.yesVotes + a.noVotes;
        if (totalVotes >= 5) { // minimum votes threshold for 5 validators (80% cutoff)
            uint256 yesPercent = (a.yesVotes * 100) / totalVotes;
            if (yesPercent >= 80) {
                _finalize(articleId, Status.Published);
            } else {
                _finalize(articleId, Status.Rejected);
            }
        }
    }

    /// @notice Internal finalize: set final status and reward/slash validators
    function _finalize(uint256 articleId, Status status) internal {
        Article storage a = articles[articleId];
        a.status = status;

        // reward/punish validators who voted
        uint256 len = a.validators.length();
        for (uint256 i = 0; i < len; i++) {
            address v = a.validators.at(i);
            bool votedYes = a.voteDecision[v];

            // If article published and validator voted yes => reward
            // If article rejected and validator voted no => reward
            if ((status == Status.Published && votedYes) || (status == Status.Rejected && !votedYes)) {
                // reward
                // stakingContract.rewardValidator will increase stakedBalance for the validator
                // ArticleRegistry must have ADMIN_ROLE on the staking contract to call this.
                stakingContract.rewardValidator(v, REWARD_AMOUNT);
            } else {
                // slash
                // will revert if validator has insufficient stake — that's fine to bubble up.
                // If you prefer not to revert the finalize on insufficient stake, add try/catch
                stakingContract.slashValidator(v, PENALTY_AMOUNT);
            }
        }

        emit ArticleFinalized(articleId, status);
    }

    /// @notice Get article details
    function getArticle(uint256 articleId)
        external
        view
        returns (
            uint256 id,
            address author,
            string memory ipfsCid,
            bytes32 contentHash,
            uint256 trustScore,
            uint256 timestamp,
            Status status,
            uint256 yesVotes,
            uint256 noVotes,
            uint256 versionCount
        )
    {
        Article storage a = articles[articleId];
        require(a.id != 0, "Article not found");
        ArticleVersion storage latestVersion = a.versions[a.versions.length - 1];
        return (
            a.id,
            a.author,
            latestVersion.ipfsCid,
            latestVersion.contentHash,
            a.trustScore,
            latestVersion.timestamp,
            a.status,
            a.yesVotes,
            a.noVotes,
            a.versions.length
        );
    }

    /// @notice Get a specific version of an article
    function getArticleVersion(uint256 articleId, uint256 versionIndex)
        external
        view
        returns (
            string memory ipfsCid,
            bytes32 contentHash,
            uint256 timestamp
        )
    {
        Article storage a = articles[articleId];
        require(a.id != 0, "Article not found");
        require(versionIndex < a.versions.length, "Version not found");
        ArticleVersion storage version = a.versions[versionIndex];
        return (version.ipfsCid, version.contentHash, version.timestamp);
    }

    /// @notice Get update proposal details
    function getUpdateProposal(uint256 articleId, uint256 proposalId)
        external
        view
        returns (
            uint256 _proposalId,
            string memory newIpfsCid,
            bytes32 newContentHash,
            address proposer,
            uint256 yesVotes,
            uint256 noVotes,
            Status status,
            uint256 createdAt
        )
    {
        ArticleUpdateProposal storage proposal = articleUpdateProposals[articleId][proposalId];
        require(proposal.createdAt != 0, "Proposal not found");
        return (
            proposal.proposalId,
            proposal.newIpfsCid,
            proposal.newContentHash,
            proposal.proposer,
            proposal.yesVotes,
            proposal.noVotes,
            proposal.status,
            proposal.createdAt
        );
    }

    /// @notice Get the current proposal ID for an article
    function getCurrentProposalId(uint256 articleId) external view returns (uint256) {
        Article storage a = articles[articleId];
        require(a.id != 0, "Article not found");
        return a.nextProposalId - 1; // Return the last created proposal ID, or 0 if none
    }

    /// @notice Get the total number of articles submitted
    function totalArticles() external view returns (uint256) {
        return _articleIds;
    }

    // Optional helper: let admin update staking contract address (if needed)
    function setStakingContract(address stakingAddress) external onlyRole(ADMIN_ROLE) {
        require(stakingAddress != address(0), "Invalid address");
        stakingContract = ValidatorStaking(stakingAddress);
    }
}