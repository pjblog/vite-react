import React from "react";

export interface Props {
  root: string,
  configFile: string | false,
  clientUrl: string,
  entries: Record<'home' | 'articles' | 'article' | 'html' | 'forbiden' | 'close' | 'notfound' | 'error', string>,
  dist: string,
  build: string,
}

export type Injector = (opts: {
  name: keyof Props['entries'],
  manifest: any,
  ssrManifest: any,
  stylesheets: string[],
  scriptLinks: string[],
  styles: string[],
  bodyPrefixScripts: string[],
  bodySuffixScripts: string[],
  children: React.ReactNode,
}) => React.ReactNode | Promise<React.ReactNode>