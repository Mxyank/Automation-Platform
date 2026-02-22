import { useQuery } from "@tanstack/react-query";

export interface SiteSetting {
    id: number;
    key: string;
    value: boolean;
    label: string;
    description?: string;
    updatedAt: string;
}

export function useFeatures() {
    const { data: settings = [], isLoading } = useQuery<SiteSetting[]>({
        queryKey: ["/api/site-settings"],
    });

    /**
     * Checks if a specific feature is enabled.
     * @param featureKey The key of the feature (e.g., 'docker_generation' or 'feature_docker_generation')
     * @returns boolean indicating if the feature is enabled
     */
    const isEnabled = (featureKey: string) => {
        const fullKey = featureKey.startsWith('feature_') ? featureKey : `feature_${featureKey}`;
        const setting = settings.find(s => s.key === fullKey);
        // If setting doesn't exist yet, we assume it's enabled by default
        // or wait for seeding to complete.
        return setting ? setting.value : true;
    };

    return {
        isEnabled,
        isLoading,
        allFeatures: settings.filter(s => s.key.startsWith('feature_')),
        getFeature: (key: string) => settings.find(s => s.key === (key.startsWith('feature_') ? key : `feature_${key}`)),
    };
}
