"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageFlags = exports.ButtonStyles = exports.ComponentTypes = void 0;
exports.createContainer = createContainer;
exports.createSection = createSection;
exports.createTextDisplay = createTextDisplay;
exports.createThumbnail = createThumbnail;
exports.createMediaGallery = createMediaGallery;
exports.createSeparator = createSeparator;
exports.createButton = createButton;
exports.createLinkButton = createLinkButton;
exports.createStringSelect = createStringSelect;
exports.createActionRow = createActionRow;
exports.componentsV2Payload = componentsV2Payload;
exports.componentsV2Update = componentsV2Update;
exports.ComponentTypes = {
    ACTION_ROW: 1,
    TEXT_DISPLAY: 10,
    SECTION: 9,
    THUMBNAIL: 11,
    MEDIA_GALLERY: 12,
    FILE: 13,
    BUTTON: 2,
    STRING_SELECT: 3,
    USER_SELECT: 5,
    ROLE_SELECT: 6,
    MENTIONABLE_SELECT: 7,
    CHANNEL_SELECT: 8,
    SEPARATOR: 14,
    CONTAINER: 17,
};
exports.ButtonStyles = {
    PRIMARY: 1,
    SECONDARY: 2,
    SUCCESS: 3,
    DANGER: 4,
    LINK: 5,
    PREMIUM: 6,
};
exports.MessageFlags = {
    COMPONENTS_V2: 32768,
    EPHEMERAL: 64,
    SUPPRESS_EMBEDS: 4096,
    SUPPRESS_NOTIFICATIONS: 8192,
};
function createContainer(components, accentColor) {
    const container = {
        type: exports.ComponentTypes.CONTAINER,
        components,
    };
    if (accentColor)
        container.accent_color = accentColor;
    return container;
}
function createSection(components, accessory) {
    const section = {
        type: exports.ComponentTypes.SECTION,
        components,
    };
    if (accessory)
        section.accessory = accessory;
    return section;
}
function createTextDisplay(content) {
    return {
        type: exports.ComponentTypes.TEXT_DISPLAY,
        content,
    };
}
function createThumbnail(media) {
    return {
        type: exports.ComponentTypes.THUMBNAIL,
        media,
    };
}
function createMediaGallery(items) {
    return {
        type: exports.ComponentTypes.MEDIA_GALLERY,
        items,
    };
}
function createSeparator(divider = true, spacing = 1) {
    return {
        type: exports.ComponentTypes.SEPARATOR,
        divider,
        spacing,
    };
}
function createButton(customId, label, style = exports.ButtonStyles.PRIMARY, disabled = false, emoji) {
    const button = {
        type: exports.ComponentTypes.BUTTON,
        style,
        label,
        custom_id: customId,
        disabled,
    };
    if (emoji)
        button.emoji = emoji;
    return button;
}
function createLinkButton(url, label, emoji) {
    const button = {
        type: exports.ComponentTypes.BUTTON,
        style: exports.ButtonStyles.LINK,
        label,
        url,
    };
    if (emoji)
        button.emoji = emoji;
    return button;
}
function createStringSelect(customId, options, placeholder = 'Select an option', minValues = 1, maxValues = 1, disabled = false) {
    return {
        type: exports.ComponentTypes.STRING_SELECT,
        custom_id: customId,
        options,
        placeholder,
        min_values: minValues,
        max_values: maxValues,
        disabled,
    };
}
function createActionRow(...components) {
    return {
        type: exports.ComponentTypes.ACTION_ROW,
        components,
    };
}
function componentsV2Payload(content, components, ephemeral = false) {
    const flags = exports.MessageFlags.COMPONENTS_V2 | (ephemeral ? exports.MessageFlags.EPHEMERAL : 0);
    return {
        content,
        components: [createContainer(components)],
        flags,
    };
}
function componentsV2Update(components) {
    return {
        components: [createContainer(components)],
        flags: exports.MessageFlags.COMPONENTS_V2,
    };
}
//# sourceMappingURL=v2.js.map