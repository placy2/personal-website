import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CASE_STUDIES, type CaseStudy as CaseStudyData } from '../data/caseStudies';
import { ROUTES } from '../constants';
import '../stylesheets/Work.css';

const SECTIONS: { key: keyof CaseStudyData; heading: string }[] = [
  { key: 'context', heading: 'Context' },
  { key: 'problem', heading: 'Problem' },
  { key: 'whatIDid', heading: 'What I did' },
  { key: 'result', heading: 'Result' },
  { key: 'wouldChange', heading: "What I'd change" },
];

const BackLink: React.FC = () => (
  <p>
    <Link to={ROUTES.WORK}>&larr; All work</Link>
  </p>
);

const CaseStudy: React.FC = () => {
  const { slug } = useParams();
  const study = CASE_STUDIES.find(entry => entry.slug === slug);

  // Only reachable client-side: every real slug is prerendered, and unknown
  // paths fall through to CloudFront's error response before React runs.
  if (!study) {
    return (
      <article>
        <BackLink />
        <h1>Case study not found</h1>
        <p>There&apos;s no case study at this address.</p>
      </article>
    );
  }

  return (
    <article className="case-study">
      <BackLink />
      <h1>{study.title}</h1>
      <ul className="tag-list" aria-label="Technologies">
        {study.tags.map(tag => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      {SECTIONS.map(({ key, heading }) => (
        <section key={key}>
          <h2>{heading}</h2>
          <p>{study[key]}</p>
        </section>
      ))}
    </article>
  );
};

export default CaseStudy;
