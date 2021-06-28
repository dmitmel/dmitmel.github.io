import { LegacyManifest, Manifest } from 'ultimate-crosscode-typedefs/file-types/mod-manifest';
export declare class ManifestValidationError extends Error {
    problems: string[];
    constructor(problems: string[]);
}
export declare class Validator {
    private problems;
    validate(data: Manifest): void;
    validateLegacy(data: LegacyManifest): void;
    private assertType;
    private assertLocalizedString;
    private assertKeywords;
    private assertPeople;
    private assertPerson;
    private assertDependencies;
    private assertDependency;
    private assertAssets;
    private assertModIcons;
}
export declare function convertFromLegacy(data: LegacyManifest): Manifest;
