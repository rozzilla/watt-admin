// FIXME: add types directly on the plt module
declare module '@platformatic/ui-components' {
  import { ReactElement, ComponentType } from 'react';

  export interface PlatformaticIconProps {
    iconName: string;
    color?: string;
    size?: string;
    onClick?: () => void;
    disabled?: boolean;
  }

  export interface CopyAndPasteProps {
    value: any;
    tooltipLabel?: string;
    color?: string;
    size?: string;
    tooltipClassName?: string;
    position?: string;
  }

  export const PlatformaticIcon: ComponentType<PlatformaticIconProps>;
  export const CopyAndPaste: ComponentType<CopyAndPasteProps>;
}

declare module '@platformatic/ui-components/src/components/constants' {
  export const WHITE: string;
  export const SMALL: string;
  export const POSITION_END: string;
}