export const seedEvents = [
  // Proven links — these form clusters
  { from: 'email:naman@company.com', to: 'github:naman-k', proof: 'oauth', confidence: 'authoritative' },
  { from: 'email:naman@company.com', to: 'slack:naman_k', proof: 'sso_record', confidence: 'authoritative' },
  { from: 'github:naman-k', to: 'device:mac-abc123', proof: 'git_config', confidence: 'authoritative' },

  // Post acquisition — same person, different domain, not yet proven
  { from: 'email:naman@oldco.com', to: 'directory:naman.kumar', proof: 'corp_directory', confidence: 'authoritative' },
  { from: 'email:naman@oldco.com', to: 'email:naman@company.com', proof: 'name_similarity', confidence: 'hint' },

  // Device fingerprint that looks related but isn't proven
  { from: 'device:mac-xyz999', to: 'slack:naman_k', proof: 'same_network', confidence: 'hint' },

  // Second person — clean cluster
  { from: 'email:priya@company.com', to: 'github:priya-s', proof: 'oauth', confidence: 'authoritative' },
  { from: 'email:priya@company.com', to: 'slack:priya_sharma', proof: 'sso_record', confidence: 'authoritative' },
]
