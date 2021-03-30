var Type;
(function (Type) {
    Type["string"] = "string";
    Type["number"] = "number";
    Type["boolean"] = "boolean";
    Type["array"] = "array";
    Type["object"] = "object";
    Type["null"] = "null";
    Type["unknown"] = "unknown";
})(Type || (Type = {}));
function getType(value) {
    // eslint-disable-next-line eqeqeq
    if (value === null)
        return Type.null;
    if (typeof value === 'string')
        return Type.string;
    if (typeof value === 'number')
        return Type.number;
    if (typeof value === 'boolean')
        return Type.boolean;
    if (Array.isArray(value))
        return Type.array;
    if (typeof value === 'object')
        return Type.object;
    return Type.unknown;
}
// TODO: investigate prototype chain bugs when extending `Error` here
export class ManifestValidationError extends Error {
    constructor(problems) {
        super(`\n${problems.map((p) => `- ${p}`).join('\n')}`);
        this.problems = problems;
        this.name = new.target.name;
    }
}
function jsonPathToString(path) {
    if (path.length === 0)
        return '<document>';
    let str = '';
    for (let i = 0; i < path.length; i++) {
        let key = path[i];
        if (typeof key === 'number') {
            str += `[${key}]`;
        }
        else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
            if (i > 0)
                str += '.';
            str += key;
        }
        else {
            str += `[${JSON.stringify(key)}]`;
        }
    }
    return str;
}
/* eslint-disable no-undefined */
export class Validator {
    constructor() {
        this.problems = [];
    }
    validate(data) {
        this.problems = [];
        if (this.assertType([], data, [Type.object]).status === 'ok') {
            if (this.assertType(['id'], data.id, [Type.string]).status === 'ok') {
                if (!/^[a-zA-Z0-9_-]+$/.test(data.id)) {
                    this.problems.push('id must consist only of one or more alphanumberic characters, hyphens or underscores');
                }
            }
            this.assertType(['version'], data.version, [Type.string], true);
            this.assertLocalizedString(['title'], data.title, true);
            this.assertLocalizedString(['description'], data.description, true);
            this.assertType(['license'], data.license, [Type.string], true);
            this.assertLocalizedString(['homepage'], data.homepage, true);
            this.assertKeywords(['keywords'], data.keywords);
            this.assertModIcons(['icons'], data.icons);
            this.assertPeople(['authors'], data.authors);
            this.assertDependencies(['dependencies'], data.dependencies, false);
            this.assertAssets(['assets'], data.assets);
            this.assertType(['assetsDir'], data.assetsDir, [Type.string], true);
            this.assertType(['plugin'], data.plugin, [Type.string], true);
            this.assertType(['preload'], data.preload, [Type.string], true);
            this.assertType(['postload'], data.postload, [Type.string], true);
            this.assertType(['prestart'], data.prestart, [Type.string], true);
            this.assertType(['poststart'], data.poststart, [Type.string], true);
        }
        if (this.problems.length > 0) {
            throw new ManifestValidationError(this.problems);
        }
    }
    validateLegacy(data) {
        this.problems = [];
        if (this.assertType([], data, [Type.object]).status === 'ok') {
            this.assertType(['name'], data.name, [Type.string]);
            this.assertType(['version'], data.version, [Type.string], true);
            this.assertType(['ccmodHumanName'], data.ccmodHumanName, [Type.string], true);
            this.assertType(['description'], data.description, [Type.string], true);
            this.assertType(['license'], data.license, [Type.string], true);
            this.assertType(['homepage'], data.homepage, [Type.string], true);
            this.assertModIcons(['icons'], data.icons);
            if (data.ccmodDependencies !== undefined) {
                this.assertDependencies(['ccmodDependencies'], data.ccmodDependencies, true);
            }
            else {
                this.assertDependencies(['dependencies'], data.dependencies, true);
            }
            this.assertAssets(['assets'], data.assets);
            this.assertType(['plugin'], data.plugin, [Type.string], true);
            this.assertType(['preload'], data.preload, [Type.string], true);
            this.assertType(['postload'], data.postload, [Type.string], true);
            this.assertType(['prestart'], data.prestart, [Type.string], true);
            this.assertType(['main'], data.main, [Type.string], true);
        }
        if (this.problems.length > 0) {
            throw new ManifestValidationError(this.problems);
        }
    }
    assertType(valuePath, value, expectedTypes, optional = false) {
        if (value === undefined) {
            if (optional) {
                return { status: 'optional' };
            }
            else {
                this.problems.push(`'${jsonPathToString(valuePath)}' is required`);
                return { status: 'failed' };
            }
        }
        let actualType = getType(value);
        if (!expectedTypes.includes(actualType)) {
            let valuePathStr = jsonPathToString(valuePath);
            let expectedTypesStr = expectedTypes.join(' or ');
            this.problems.push(`expected type of '${valuePathStr}' to be '${expectedTypesStr}', got '${actualType}'`);
            return { status: 'failed' };
        }
        return { status: 'ok', type: actualType };
    }
    assertLocalizedString(valuePath, value, optional = false) {
        let assertion = this.assertType(valuePath, value, [Type.object, Type.string], optional);
        if (assertion.status !== 'ok')
            return;
        value = value;
        if (assertion.type === Type.string)
            return;
        for (let [key, value2] of Object.entries(value)) {
            this.assertType([...valuePath, key], value2, [Type.string]);
        }
    }
    assertKeywords(valuePath, value) {
        let assertion = this.assertType(valuePath, value, [Type.array], true);
        if (assertion.status !== 'ok')
            return;
        value = value;
        for (let index = 0; index < value.length; index++) {
            let value2 = value[index];
            this.assertLocalizedString([...valuePath, index], value2);
        }
    }
    assertPeople(valuePath, value) {
        let assertion = this.assertType(valuePath, value, [Type.array], true);
        if (assertion.status !== 'ok')
            return;
        value = value;
        for (let index = 0; index < value.length; index++) {
            let value2 = value[index];
            this.assertPerson([...valuePath, index], value2);
        }
    }
    assertPerson(valuePath, value) {
        let assertion = this.assertType(valuePath, value, [Type.object, Type.string]);
        if (assertion.status !== 'ok')
            return;
        if (assertion.type === Type.string)
            return;
        value = value;
        this.assertLocalizedString([...valuePath, 'name'], value.name);
        this.assertLocalizedString([...valuePath, 'email'], value.email, true);
        this.assertLocalizedString([...valuePath, 'url'], value.url, true);
        this.assertLocalizedString([...valuePath, 'comment'], value.comment, true);
    }
    assertDependencies(valuePath, value, legacy) {
        let assertion = this.assertType(valuePath, value, [Type.object], true);
        if (assertion.status !== 'ok')
            return;
        value = value;
        for (let [key, value2] of Object.entries(value)) {
            let valuePath2 = [...valuePath, key];
            if (legacy)
                this.assertType(valuePath2, value2, [Type.string]);
            else
                this.assertDependency(valuePath2, value2);
        }
    }
    assertDependency(valuePath, value) {
        let assertion = this.assertType(valuePath, value, [Type.object, Type.string]);
        if (assertion.status !== 'ok')
            return;
        if (assertion.type === Type.string)
            return;
        value = value;
        this.assertType([...valuePath, 'version'], value.version, [Type.string]);
        this.assertType([...valuePath, 'optional'], value.optional, [Type.boolean], true);
    }
    assertAssets(valuePath, value) {
        let assertion = this.assertType(valuePath, value, [Type.array], true);
        if (assertion.status !== 'ok')
            return;
        value = value;
        for (let index = 0; index < value.length; index++) {
            let value2 = value[index];
            this.assertType([...valuePath, index], value2, [Type.string]);
        }
    }
    assertModIcons(valuePath, value) {
        let assertion = this.assertType(valuePath, value, [Type.object], true);
        if (assertion.status !== 'ok')
            return;
        value = value;
        for (let [key, value2] of Object.entries(value)) {
            this.assertType([...valuePath, key], value2, [Type.string]);
        }
    }
}
export function convertFromLegacy(data) {
    var _a, _b;
    return {
        id: data.name,
        version: data.version,
        license: data.license,
        title: data.ccmodHumanName,
        description: data.description,
        homepage: data.homepage,
        icons: data.icons,
        dependencies: (_a = data.ccmodDependencies) !== null && _a !== void 0 ? _a : data.dependencies,
        assets: (_b = data.assets) === null || _b === void 0 ? void 0 : _b.map((path) => (path.startsWith('assets/') ? path.slice(7) : path)),
        plugin: data.plugin,
        preload: data.preload,
        postload: data.postload,
        prestart: data.prestart,
        poststart: data.main,
    };
}
//# sourceMappingURL=manifest.js.map