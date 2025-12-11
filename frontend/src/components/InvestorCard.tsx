import type { InvestorData } from '../types';

interface InvestorCardProps {
  investor: InvestorData;
}

export default function InvestorCard({ investor }: InvestorCardProps) {
  const handleSendEmail = () => {
    // Try to extract email from description or use a generic mailto
    const subject = encodeURIComponent(`Inquiry for ${investor.vcName || investor.investorName}`);
    window.location.href = `mailto:?subject=${subject}`;
  };

  const handleVisitWebsite = () => {
    if (investor.url) {
      window.open(investor.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLinkedIn = () => {
    if (investor.linkedinUrl) {
      window.open(investor.linkedinUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="investor-card">
      <div className="card-header">
        <h2 className="vc-name">{investor.vcName || 'Unknown VC'}</h2>
        {investor.investorName && (
          <p className="investor-name">Contact: {investor.investorName}</p>
        )}
      </div>

      <div className="card-body">
        {investor.description && (
          <p className="description">{investor.description}</p>
        )}

        <div className="details-grid">
          {investor.focusAreas && investor.focusAreas.length > 0 && (
            <div className="detail-item">
              <span className="label">Focus Areas:</span>
              <div className="tags">
                {investor.focusAreas.map((area, idx) => (
                  <span key={idx} className="tag">{area}</span>
                ))}
              </div>
            </div>
          )}

          {investor.fundingStages && investor.fundingStages.length > 0 && (
            <div className="detail-item">
              <span className="label">Funding Stages:</span>
              <div className="tags">
                {investor.fundingStages.map((stage, idx) => (
                  <span key={idx} className="tag stage">{stage}</span>
                ))}
              </div>
            </div>
          )}

          {investor.checkSize && (
            <div className="detail-item">
              <span className="label">Check Size:</span>
              <span className="value">{investor.checkSize}</span>
            </div>
          )}

          {investor.fundingRequirements && (
            <div className="detail-item">
              <span className="label">Funding Requirements:</span>
              <span className="value">{investor.fundingRequirements}</span>
            </div>
          )}

          {investor.geographical && investor.geographical.length > 0 && (
            <div className="detail-item">
              <span className="label">Location:</span>
              <div className="tags">
                {investor.geographical.map((geo, idx) => (
                  <span key={idx} className="tag geo">{geo}</span>
                ))}
              </div>
            </div>
          )}

          {investor.targetCountries && investor.targetCountries.length > 0 && (
            <div className="detail-item">
              <span className="label">Target Countries:</span>
              <div className="tags">
                {investor.targetCountries.map((country, idx) => (
                  <span key={idx} className="tag country">{country}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card-actions">
        <button 
          onClick={handleSendEmail} 
          className="btn btn-primary"
          title="Send Email"
        >
          📧 Send Email
        </button>
        {investor.url && (
          <button 
            onClick={handleVisitWebsite} 
            className="btn btn-secondary"
            title="Visit Website"
          >
            🌐 Visit Website
          </button>
        )}
        {investor.linkedinUrl && (
          <button 
            onClick={handleLinkedIn} 
            className="btn btn-linkedin"
            title="LinkedIn Profile"
          >
            💼 LinkedIn
          </button>
        )}
      </div>
    </div>
  );
}

