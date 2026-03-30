-- Referral codes: one per user, 8-char unique code
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(8) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_referral UNIQUE (user_id)
);

CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);

-- Referral tracking: links referrer to referred user
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id),
  referred_user_id UUID REFERENCES auth.users(id),
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id),
  status VARCHAR(20) NOT NULL DEFAULT 'signed_up',
  -- status: signed_up, converted (upgraded to Pro), credited
  referrer_credited BOOLEAN NOT NULL DEFAULT false,
  referred_credited BOOLEAN NOT NULL DEFAULT false,
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ,
  credited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_code ON referrals(referral_code_id);

-- RLS policies
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can read their own referral code
CREATE POLICY "Users can view own referral code"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own referral code
CREATE POLICY "Users can create own referral code"
  ON referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anyone can look up a referral code by code value (for resolving during signup)
CREATE POLICY "Anyone can resolve referral codes"
  ON referral_codes FOR SELECT
  USING (is_active = true);

-- Users can view referrals where they are the referrer
CREATE POLICY "Referrers can view their referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_user_id);

-- Users can view referrals where they are the referred user
CREATE POLICY "Referred users can view their referral"
  ON referrals FOR SELECT
  USING (auth.uid() = referred_user_id);
