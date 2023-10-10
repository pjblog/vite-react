import { build } from 'vite';
import { Props } from './types';
import { resolve } from 'node:path';
export function BuildWithVite(ssr: boolean, props: Props) {
  return build({
    root: props.root,
    configFile: props.configFile,
    plugins: [
      {
        name: 'vite:pjblog:build',
        apply: 'build',
        config(_, { command }) {
          if (command !== 'build') return;
          if (ssr) {
            return {
              build: {
                ssr: true,
                outDir: resolve(props.root, props.build),
                manifest: true,
                ssrEmitAssets: true,
                ssrManifest: true,
                rollupOptions: {
                  input: {
                    html: resolve(props.root, props.entries.html),
                    home: resolve(props.root, props.entries.home),
                    articles: resolve(props.root, props.entries.articles),
                    article: resolve(props.root, props.entries.article),
                    forbiden: resolve(props.root, props.entries.forbiden),
                    close: resolve(props.root, props.entries.close),
                    notfound: resolve(props.root, props.entries.notfound),
                    error: resolve(props.root, props.entries.error),
                  }
                }
              },
              ssr: {
                format: 'cjs',
              }
            }
          } else {
            return {
              build: {
                manifest: true,
                outDir: resolve(props.root, props.dist),
              }
            }
          }
        }
      }
    ]
  })
}