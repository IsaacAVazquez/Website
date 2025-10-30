import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consulting - Isaac Vazquez',
  description: 'Product management consulting and advisory services. Strategic product leadership combining technical expertise with business strategy.',
};

export default function ConsultingPage() {
  return (
    <>
      <h1>Consulting</h1>
      
      <section>
        <p>
          I help organizations build better products through strategic product management 
          and technical excellence. My approach combines 6+ years of technical experience 
          with world-class business strategy frameworks from UC Berkeley Haas.
        </p>
        
        <p>
          Whether you're a startup scaling from prototype to product-market fit or an 
          established company optimizing your product development process, I bring a 
          unique perspective that bridges engineering excellence with strategic vision.
        </p>
      </section>

      <section>
        <h2>Services</h2>
        
        <div className="service-item">
          <h3>Product Strategy & Roadmap</h3>
          <p>
            Strategic product planning that aligns technical capabilities with business 
            objectives. I help define product vision, prioritize features, and create 
            actionable roadmaps that teams can execute.
          </p>
        </div>
        
        <div className="service-item">
          <h3>Technical Product Management</h3>
          <p>
            Bridging the gap between engineering teams and business stakeholders. I 
            translate complex technical constraints into business language and ensure 
            product decisions are informed by both user needs and technical realities.
          </p>
        </div>
        
        <div className="service-item">
          <h3>Quality & Process Optimization</h3>
          <p>
            Drawing from extensive QA engineering experience, I help teams build quality 
            into their development process. This includes testing strategy, automation 
            frameworks, and quality metrics that drive better outcomes.
          </p>
        </div>
      </section>

      <section id="advisory">
        <h2>Advisory & Mentoring</h2>
        
        <p>
          I work with technical professionals transitioning into product management roles 
          and early-stage founders building their first products. My mentoring focuses 
          on practical frameworks and real-world experience from both Austin civic tech 
          and Silicon Valley innovation environments.
        </p>
        
        <p>
          Areas I commonly advise on include product-market fit validation, technical 
          architecture decisions, team building, and strategic planning for technical products.
        </p>
      </section>

      <section>
        <h2>Background</h2>
        
        <p>
          Currently pursuing MBA at UC Berkeley Haas while maintaining hands-on technical 
          work. I've contributed to products serving 60M+ users across Austin and California 
          markets, giving me deep insight into both user needs and technical constraints.
        </p>
        
        <p>
          My technical foundation in QA engineering and software development provides unique 
          credibility when working with engineering teams, while my business education at 
          Haas ensures strategic thinking about market positioning and competitive advantage.
        </p>
      </section>

      <section>
        <h2>Let's work together</h2>
        
        <p>
          I work with a select number of clients to ensure I can provide the focused 
          attention and strategic depth your project deserves.
        </p>
        
        <p>
          <a href="mailto:isaacavazquez95@gmail.com">
            Email me
          </a> to discuss your product challenges and how I might help.
        </p>
      </section>
    </>
  );
}