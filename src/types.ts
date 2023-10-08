export interface Props {
  root: string,
  configFile: string | false,
  clientUrl: string,
  namespace: string,
  entries: Record<'home' | 'articles' | 'article' | 'html' | 'forbiden' | 'close' | 'notfound' | 'error', string>,
  dist: string,
  build: string,
}