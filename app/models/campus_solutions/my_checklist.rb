module CampusSolutions
  class MyChecklist < UserSpecificModel

    include Cache::LiveUpdatesEnabled
    include Cache::JsonAddedCacher
    include CampusSolutions::SirFeatureFlagged

    def get_feed_internal
      return {} unless is_feature_enabled && HubEdos::UserAttributes.new(user_id: @uid).has_role?(:applicant, :student)
      CampusSolutions::Checklist.new({user_id: @uid}).get
    end

  end
end
