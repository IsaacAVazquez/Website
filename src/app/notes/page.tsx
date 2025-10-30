import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notes',
  description: 'My digital garden - quick thoughts, technical notes, and learning resources.',
};

// Temporary notes data
const notes = [
  {
    slug: 'product-strategy-frameworks',
    title: 'Product Strategy Frameworks',
    tags: ['product-management', 'strategy', 'frameworks'],
    updated: '2025-01-20',
  },
  {
    slug: 'technical-debt-management',
    title: 'Technical Debt Management',
    tags: ['engineering', 'technical-leadership', 'debt'],
    updated: '2025-01-18',
  },
  {
    slug: 'mba-learnings-haas',
    title: 'UC Berkeley Haas MBA Learnings',
    tags: ['mba', 'berkeley', 'business-school'],
    updated: '2025-01-15',
  },
];

// Get all unique tags
const allTags = [...new Set(notes.flatMap(note => note.tags))].sort();

export default function NotesPage() {
  return (
    <>
      <h1>Notes</h1>
      <p>
        My digital garden of quick thoughts, technical notes, and learning resources. 
        These are works in progress, updated as I learn and discover new insights.
      </p>

      <section>
        <h2>All tags</h2>
        <div>
          {allTags.map((tag) => (
            <Link 
              key={tag} 
              href={`/notes?tag=${tag}`} 
              className="tag"
            >
              {tag}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2>Recent notes</h2>
        <ul className="post-list">
          {notes
            .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
            .map((note) => (
              <li key={note.slug}>
                <div>
                  <Link href={`/notes/${note.slug}`} className="post-title">
                    {note.title}
                  </Link>
                  <div className="note-tags">
                    {note.tags.map((tag) => (
                      <Link 
                        key={tag} 
                        href={`/notes?tag=${tag}`} 
                        className="tag"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
                <span className="post-date">Updated {note.updated}</span>
              </li>
            ))}
        </ul>
      </section>
    </>
  );
}