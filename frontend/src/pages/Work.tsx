import React from 'react';
import { Link } from 'react-router-dom';
import { CASE_STUDIES } from '../data/caseStudies';
import { workPath } from '../constants';
import '../stylesheets/Work.css';

const Work: React.FC = () => {
  return (
    <div>
      <h1>Work</h1>
      <p>
        Short write-ups of platform work I&apos;ve done: the context, the problem, what I built, and
        what I&apos;d change. Each one reads in about a minute.
      </p>
      <section aria-labelledby="case-studies-heading">
        <h2 id="case-studies-heading">Case studies</h2>
        <ul className="case-study-list">
          {CASE_STUDIES.map(study => (
            <li key={study.slug} className="case-study-card">
              <h3>
                <Link to={workPath(study.slug)}>{study.title}</Link>
              </h3>
              <p>{study.summary}</p>
              <ul className="tag-list" aria-label="Technologies">
                {study.tags.map(tag => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Work;
