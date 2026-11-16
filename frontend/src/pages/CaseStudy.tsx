import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CASE_STUDIES, type CaseStudyFigure, type CaseStudySection } from '../data/caseStudies';
import { ROUTES } from '../constants';
import '../stylesheets/Work.css';

const SECTIONS: { key: CaseStudySection; heading: string }[] = [
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

const Figure: React.FC<{ figure: CaseStudyFigure }> = ({ figure }) => (
  <figure
    className={
      figure.images.length > 1 ? 'case-study-figure case-study-figure-pair' : 'case-study-figure'
    }
  >
    <div className="case-study-figure-images">
      {figure.images.map(image => (
        <img
          key={image.src}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
    <figcaption>{figure.caption}</figcaption>
  </figure>
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
      {SECTIONS.map(({ key, heading }) =>
        study[key] ? (
          <React.Fragment key={key}>
            <section>
              <h2>{heading}</h2>
              <p>{study[key]}</p>
            </section>
            {study.figures
              ?.filter(figure => figure.after === key)
              .map(figure => (
                <Figure key={figure.images[0].src} figure={figure} />
              ))}
          </React.Fragment>
        ) : null
      )}
    </article>
  );
};

export default CaseStudy;
