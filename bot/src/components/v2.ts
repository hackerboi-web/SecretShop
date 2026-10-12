export const ComponentTypes = {
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
} as const;

export const ButtonStyles = {
  PRIMARY: 1,
  SECONDARY: 2,
  SUCCESS: 3,
  DANGER: 4,
  LINK: 5,
  PREMIUM: 6,
} as const;

export const MessageFlags = {
  COMPONENTS_V2: 32768,
  EPHEMERAL: 64,
  SUPPRESS_EMBEDS: 4096,
  SUPPRESS_NOTIFICATIONS: 8192,
} as const;

export function createContainer(components: any[], accentColor?: number) {
  const container: any = {
    type: ComponentTypes.CONTAINER,
    components,
  };
  if (accentColor) container.accent_color = accentColor;
  return container;
}

export function createSection(components: any[], accessory?: any) {
  const section: any = {
    type: ComponentTypes.SECTION,
    components,
  };
  if (accessory) section.accessory = accessory;
  return section;
}

export function createTextDisplay(content: string) {
  return {
    type: ComponentTypes.TEXT_DISPLAY,
    content,
  };
}

export function createThumbnail(media: { url: string; description?: string }) {
  return {
    type: ComponentTypes.THUMBNAIL,
    media,
  };
}

export function createMediaGallery(items: Array<{ media: { url: string; description?: string } }>) {
  return {
    type: ComponentTypes.MEDIA_GALLERY,
    items,
  };
}

export function createSeparator(divider = true, spacing = 1) {
  return {
    type: ComponentTypes.SEPARATOR,
    divider,
    spacing,
  };
}

export function createButton(
  customId: string,
  label: string,
  style: number = ButtonStyles.PRIMARY,
  disabled = false,
  emoji?: { name: string; id?: string; animated?: boolean }
) {
  const button: any = {
    type: ComponentTypes.BUTTON,
    style,
    label,
    custom_id: customId,
    disabled,
  };
  if (emoji) button.emoji = emoji;
  return button;
}

export function createLinkButton(url: string, label: string, emoji?: any) {
  const button: any = {
    type: ComponentTypes.BUTTON,
    style: ButtonStyles.LINK,
    label,
    url,
  };
  if (emoji) button.emoji = emoji;
  return button;
}

export function createStringSelect(
  customId: string,
  options: Array<{ label: string; value: string; description?: string; emoji?: any; default?: boolean }>,
  placeholder = 'Select an option',
  minValues = 1,
  maxValues = 1,
  disabled = false
) {
  return {
    type: ComponentTypes.STRING_SELECT,
    custom_id: customId,
    options,
    placeholder,
    min_values: minValues,
    max_values: maxValues,
    disabled,
  };
}

export function createActionRow(...components: any[]) {
  return {
    type: ComponentTypes.ACTION_ROW,
    components,
  };
}

export function componentsV2Payload(content: string | null, components: any[], ephemeral = false) {
  const flags = MessageFlags.COMPONENTS_V2 | (ephemeral ? MessageFlags.EPHEMERAL : 0);
  return {
    content,
    components: [createContainer(components)],
    flags,
  };
}

export function componentsV2Update(components: any[]) {
  return {
    components: [createContainer(components)],
    flags: MessageFlags.COMPONENTS_V2,
  };
}