import c2k from 'koa-connect';
import send from 'koa-send';
import { useComponent } from '@evio/visox';
import { createServer, type ViteDevServer } from 'vite';
import { Server, Page, configs } from '@pjblog/blog';
import { Context, Middleware } from 'koa';
import { PassThrough } from 'node:stream';
import { FC } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { createElement } from 'react';
import { resolve } from 'node:path';
import { Theme, Home, Html, Articles, Article, Forbiden, Close, NotFound, ServerError } from '@pjblog/types';
import { Props } from './types';

export function createEnterence(props: Props): any {
  /**
   * 主题静态目录
   * @param ctx 
   * @param root 
   * @param path 
   * @param maxAge 
   * @returns 
   */
  const serve = (ctx: Context, root: string, path: string, maxAge = 24 * 60 * 60 * 1000) => {
    return send(ctx, path, {
      root,
      index: 'index.html',
      gzip: true,
      maxAge,
    })
  }
  return class extends Theme {
    private vite: ViteDevServer;
    private readonly pages = [
      Page.Home,
      Page.Articles,
      Page.Article,
    ]

    private async createViteInitialize() {
      this.vite = await createServer({
        root: props.root,
        configFile: props.configFile,
        server: {
          middlewareMode: true,
        }
      })
      const koaMiddlewares = c2k(this.vite.middlewares);
      const { add } = await useComponent(Server.MiddlewareServer);
      const middleware: Middleware = async (ctx, next) => {
        const loc = new URL('http://localhost' + ctx.url);
        if (this.pages.some(page => !!page.match(loc.pathname))) return await next();
        if (loc.pathname.startsWith('/-')) return await next();
        if (loc.pathname.startsWith('/~')) return await next();
        await koaMiddlewares(ctx, next);
      }
      return add(middleware);
    }

    private async createInitialize() {
      const { add } = await useComponent(Server.MiddlewareServer);
      const middleware: Middleware = async (ctx, next) => {
        if (!ctx.url.startsWith('/%')) return await next();
        const url = ctx.url.substring(2);
        await serve(ctx, props.dist, url);
      }
      const termanite = add(middleware);
      return () => {
        termanite();
        for (const key in require.cache) {
          if (key.startsWith(props.root)) {
            delete require.cache[key];
          }
        }
      }
    }

    /**
     * 初始化
     * @returns 
     */
    public initialize() {
      if (configs.bootstrap.debug) {
        return this.createViteInitialize();
      }
      return this.createInitialize();
    }

    private async createViteDevPageStream<T extends keyof Props['entries']>(name: T, state: any) {
      const stm = new PassThrough();
      const [html, page] = await Promise.all([
        this.vite.ssrLoadModule(resolve(props.root, props.entries.html)),
        this.vite.ssrLoadModule(resolve(props.root, props.entries[name])),
      ])
      const HTML = html.default as FC<Html.Props>;
      const PAGE = page.default as FC;
      const pipeable = renderToPipeableStream(createElement(HTML, {
        meta: state.meta,
        dev: true,
        scriptLinks: [props.clientUrl],
        stylesheets: [],
        bodyPrefixScripts: [
          `;window.${props.namespace} = ${JSON.stringify(state)};`
        ]
      }, createElement(PAGE, state)));
      pipeable.pipe(stm);
      return stm;
    }

    private createPageStream<T extends keyof Props['entries']>(name: T, state: any) {
      const stm = new PassThrough();
      const distManifestFilePath = resolve(props.root, props.dist, 'manifest.json');
      const buildManifestFilePath = resolve(props.root, props.build, 'manifest.json');
      const distManifest = require(distManifestFilePath);
      const buildManifest = require(buildManifestFilePath);
      const distChunk = distManifest['index.html'];
      const buildChunk = buildManifest[props.entries[name]];
      const buildHtmlChunk = buildManifest[props.entries.html];

      const buildHtmlFilePath = resolve(props.root, props.build, buildHtmlChunk.file);
      const buildPageFilePath = resolve(props.root, props.build, buildChunk.file);

      const buildHtmlFC = require(buildHtmlFilePath).default as FC<Html.Props>;
      const buildPageFC = require(buildPageFilePath).default as FC;

      const distScript = '/%/' + distChunk.file;

      const pipeable = renderToPipeableStream(createElement(buildHtmlFC, {
        meta: state.meta,
        scriptLinks: [distScript],
        stylesheets: distChunk.css.map((css: string) => '/%/' + css),
        bodyPrefixScripts: [
          `;window.${props.namespace} = ${JSON.stringify(state)};`
        ]
      }, createElement(buildPageFC, state)));
      pipeable.pipe(stm);
      return stm;
    }

    /**
     * 首页
     * @param state 
     * @returns 
     */
    public home(state: Home.Props) {
      if (configs.bootstrap.debug) {
        return this.createViteDevPageStream('home', state);
      }
      return this.createPageStream('home', state);
    }

    /**
     * 日志列表页
     * @param state 
     * @returns 
     */
    public articles(state: Articles.Props) {
      if (configs.bootstrap.debug) {
        return this.createViteDevPageStream('articles', state);
      }
      return this.createPageStream('articles', state);
    }

    /**
     * 日志详情页
     * @param state 
     * @returns 
     */
    public article(state: Article.Props) {
      if (configs.bootstrap.debug) {
        return this.createViteDevPageStream('article', state);
      }
      return this.createPageStream('article', state);
    }

    /**
     * 用户禁止登录页面
     * @param state 
     * @returns 
     */
    public forbiden(state: Forbiden.Props) {
      if (configs.bootstrap.debug) {
        return this.createViteDevPageStream('forbiden', state);
      }
      return this.createPageStream('forbiden', state);
    }

    /**
     * 网站关闭页面
     * @param state 
     * @returns 
     */
    public close(state: Close.Props) {
      if (configs.bootstrap.debug) {
        return this.createViteDevPageStream('close', state);
      }
      return this.createPageStream('close', state);
    }

    /**
     * 页面没有找到
     * @param state 
     * @returns 
     */
    public notfound(state: NotFound.Props) {
      if (configs.bootstrap.debug) {
        return this.createViteDevPageStream('notfound', state);
      }
      return this.createPageStream('notfound', state);
    }

    /**
     * 错误页面
     * @param state 
     * @returns 
     */
    public error(state: ServerError.Props) {
      if (configs.bootstrap.debug) {
        return this.createViteDevPageStream('error', state);
      }
      return this.createPageStream('error', state);
    }
  }
}