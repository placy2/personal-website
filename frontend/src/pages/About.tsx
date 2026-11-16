import React from 'react';
import '../stylesheets/About.css';

const About: React.FC = () => {
  return (
    <div className="about-content">
      <h1>A little bit about me</h1>

      <section aria-labelledby="timeline-heading">
        <h2 id="timeline-heading">Timeline</h2>
        <ol className="timeline">
          <li className="timeline-item">
            <span className="timeline-when">
              <time dateTime="2021">2021</time>
            </span>
            <p className="timeline-what">
              <span className="timeline-org">Trinity University</span>
              <span className="timeline-role">
                B.S. Computer Science, minor in Music (magna cum laude)
              </span>
            </p>
          </li>
          <li className="timeline-item">
            <span className="timeline-when">
              <time dateTime="2021">2021</time>
              <span aria-hidden="true">–</span>
              <span className="visually-hidden"> to </span>
              <time dateTime="2024">2024</time>
            </span>
            <p className="timeline-what">
              <span className="timeline-org">Credera</span>
              <span className="timeline-role">
                Technology Consultant <span aria-hidden="true">→</span>
                <span className="visually-hidden">to</span> Senior Technology Consultant
              </span>
            </p>
          </li>
          <li className="timeline-item">
            <span className="timeline-when">
              <time dateTime="2024">2024</time>
              <span aria-hidden="true">–</span>
              <span className="visually-hidden"> to </span>
              present
            </span>
            <p className="timeline-what">
              <span className="timeline-org">Triumph</span>
              <span className="timeline-role">Senior DevOps Engineer</span>
            </p>
          </li>
        </ol>
      </section>

      <h2>Early Years (Childhood-College)</h2>
      <p>
        As with many programmers, I was an 'inside kid'. A high school class led me to Java and I
        was hooked! I didn't launch a unicorn startup by 18 or anything, but I did get a solid
        foundation in programming and algorithms.
      </p>
      <p>
        I went to college at Trinity University in San Antonio, TX, where I majored in Computer
        Science and minored in Music. I deeply enjoyed being able to learn and explore the world I
        knew I wanted a career in, while simultaneously getting to make music with many of my
        now-lifelong friends. I even got to check off a few bucket list items, like singing
        Beethoven's Mass in C in{' '}
        <a
          href="https://en.wikipedia.org/wiki/St._Stephen%27s_Cathedral,_Vienna"
          target="_blank"
          rel="noopener noreferrer"
        >
          St. Stephen's Cathedral{' '}
        </a>
        and singing Haydn's creation{' '}
        <a
          href="https://en.wikipedia.org/wiki/Schloss_Esterházy"
          target="_blank"
          rel="noopener noreferrer"
        >
          where Haydn debuted it originally
        </a>
        !
      </p>

      <h2>Career</h2>
      <p>
        After school, I started in{' '}
        <a href="https://credera.com/en-us" target="_blank" rel="noopener noreferrer">
          tech consulting
        </a>
        . I contributed across the full stack in different web apps and learned how large-scale SDLC
        works in the real world. The exposure I got to financial institutions, major airlines, and
        other large clients taught me the importance of process and automation in enterprise
        software delivery.
      </p>
      <p>
        After getting a chance to dip my toes into pipeline design & development, I became
        passionate about CI/CD, reliable releases, and DevOps. This led me to switch gears to a
        Cloud/DevOps Engineer role. I now work day-to-day enabling developer teams and working
        towards safer, faster, and simpler production releases. I currently work at{' '}
        <a href="https://triumph.io" target="_blank" rel="noopener noreferrer">
          Triumph
        </a>
        .
      </p>

      <h2>Looking Forward</h2>
      <p>
        I'm still in the "soak up everything" stage of my career (and I believe any good
        technologist remains in that stage forever, to some degree)! I am always happy to learn new
        things and work with new people. Feel free to reach out if you'd like to collaborate or chat
        opinions about anything cloud, DevOps, or software delivery related!
      </p>
      <p>
        I'm not actively pursuing another role at this time, but I am always open to hearing about
        interesting opportunities. If you have one, let me know!
      </p>
    </div>
  );
};

export default About;
