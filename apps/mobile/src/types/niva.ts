export type VerificationStatus =
  'not_started' | 'pending' | 'approved' | 'needs_review' | 'rejected';

export type TrustTier =
  'new' | 'basic_verified' | 'trusted' | 'host_eligible' | 'host';

export type NivaUser = {
  id: string;
  phone: string;
  username: string;
  displayName: string;
  city: string;
  age?: number;
  bio?: string;
  languages: string[];
  occupation?: string;
  profilePhotoUrl?: string;
  interests: string[];
  selfieUrl?: string;
  selfDeclarationAccepted: boolean;
  communityGuidelinesAccepted: boolean;
  verificationStatus: VerificationStatus;
  trustScore: number;
  trustTier: TrustTier;
};

export type ProfileDraft = {
  displayName: string;
  city: string;
  age?: number;
  bio?: string;
  languages: string[];
  occupation?: string;
  profilePhoto?: SelectedProfilePhoto;
  interests: string[];
};

export type SelectedProfilePhoto = {
  mimeType?: string | null;
  uri: string;
};
