
import React from 'react';
import ArticleForm from '../components/ArticleForm';
import { useNavigate } from 'react-router-dom';

const SubmitArticlePage = () => {
  const navigate = useNavigate();

  const handleArticleSubmitted = () => {
    navigate('/');
  };

  return (
    <div>
      <ArticleForm onArticleSubmitted={handleArticleSubmitted} />
    </div>
  );
};

export default SubmitArticlePage;
