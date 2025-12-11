import InvestorCard from './InvestorCard';
import type { InvestorData } from '../types';

interface InvestorListProps {
  investors: InvestorData[];
}

export default function InvestorList({ investors }: InvestorListProps) {
  if (investors.length === 0) {
    return (
      <div className="empty-state">
        <p>No investors found.</p>
        <p className="hint">Run the scraper to collect investor data.</p>
      </div>
    );
  }

  return (
    <div className="investor-list">
      {investors.map((investor, index) => (
        <InvestorCard key={index} investor={investor} />
      ))}
    </div>
  );
}

