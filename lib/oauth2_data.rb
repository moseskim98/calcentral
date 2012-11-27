class Oauth2Data < ActiveRecord::Base
  attr_accessible :uid, :app_id, :access_token, :expiration_time, :refresh_token
  serialize :access_token
  serialize :refresh_token
  before_save :encrypt_tokens
  after_save :decrypt_tokens
  after_find :decrypt_tokens
  @@encryption_algorithm = Settings.oauth2.encryption || 'aes-256-cbc'

  def self.get_access_token(user_id, app_id)
    oauth2_data = self.where(uid: user_id, app_id: app_id).first
    oauth2_data && oauth2_data.access_token
  end

  def self.get_token_and_expiration(user_id, app_id)
    oauth2_data = self.where(uid: user_id, app_id: app_id).first
    oauth2_data && {"access_token" => oauth2_data.access_token,
                    "refresh_token" => oauth2_data.refresh_token,
                    "expiration_time" => oauth2_data.expiration_time}
  end

  def self.new_or_update(user_id, app_id, access_token, refresh_token=nil, expiration_time=nil)
    entry = self.where(:uid => user_id, :app_id => app_id).first
    entry ||= self.new(:uid => user_id, :app_id => app_id)
    entry.access_token = access_token
    entry.refresh_token = refresh_token
    entry.expiration_time = expiration_time
    entry.save
  end

  def encrypt_tokens
    self.access_token = self.class.encrypt_with_iv(self.access_token, Settings.oauth2.key)
    self.refresh_token = self.class.encrypt_with_iv(self.refresh_token, Settings.oauth2.key) if self.refresh_token
  end

  def decrypt_tokens
    self.access_token = self.class.decrypt_with_iv(self.access_token, Settings.oauth2.key)
    self.refresh_token = self.class.decrypt_with_iv(self.refresh_token, Settings.oauth2.key) if self.refresh_token
  end

  def self.encrypt_with_iv(value, key)
    return value if value.blank?
    cipher = OpenSSL::Cipher::Cipher.new(@@encryption_algorithm)
    cipher.encrypt
    iv = cipher.random_iv
    cipher.key = key
    cipher.iv = iv
    encrypted = cipher.update(value) + cipher.final
    [Base64.encode64(encrypted), Base64.encode64(iv)]
  end

  def self.decrypt_with_iv(value_with_iv, key)
    return value_with_iv if value_with_iv.blank?
    begin
      cipher = OpenSSL::Cipher::Cipher.new(@@encryption_algorithm)
      cipher.decrypt
      cipher.key = key
      cipher.iv = Base64.decode64(value_with_iv[1])
      decrypted = cipher.update(Base64.decode64(value_with_iv[0])) + cipher.final
      decrypted.to_s
    rescue
      ""
    end
  end

end
