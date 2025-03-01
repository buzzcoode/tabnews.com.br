import { renderToStaticMarkup } from 'react-dom/server';
import { Viewer } from '@bytemd/react';
import removeMarkdown from 'models/remove-markdown';

import { Feed } from 'feed';
import webserver from 'infra/webserver.js';

import gfmPlugin from '@bytemd/plugin-gfm';
import highlightSsrPlugin from '@bytemd/plugin-highlight-ssr';
import mermaidPlugin from '@bytemd/plugin-mermaid';
import breaksPlugin from '@bytemd/plugin-breaks';
import gemojiPlugin from '@bytemd/plugin-gemoji';

function generateRss2(contentList) {
  const webserverHost = webserver.getHost();
  const bytemdPluginList = [gfmPlugin(), highlightSsrPlugin(), mermaidPlugin(), breaksPlugin(), gemojiPlugin()];

  // TODO: make this property flexible in the future to
  // support things like: `/[username]/rss`
  const feedURL = `${webserverHost}/recentes/rss`;

  const feed = new Feed({
    title: 'TabNews',
    description: 'Conteúdos para quem trabalha com Programação e Tecnologia',
    id: feedURL,
    link: feedURL,
    image: `${webserverHost}/favicon-mobile.png`,
    favicon: `${webserverHost}/favicon-mobile.png`,
    language: 'pt',
    updated: contentList.length > 0 ? new Date(contentList[0].updated_at) : new Date(),
    feedLinks: {
      rss2: feedURL,
    },
  });

  contentList.forEach((contentObject) => {
    const contentUrl = `${webserverHost}/${contentObject.owner_username}/${contentObject.slug}`;

    feed.addItem({
      title: contentObject.title,
      id: contentUrl,
      link: contentUrl,
      description: removeMarkdown(contentObject.body).replace(/\s+/g, ' ').substring(0, 190) + '...',
      content: renderToStaticMarkup(<Viewer value={contentObject.body} plugins={bytemdPluginList} />).replace(
        /[\r\n]/gm,
        ''
      ),
      author: [
        {
          name: contentObject.owner_username,
          link: `${webserverHost}/${contentObject.owner_username}`,
        },
      ],
      date: new Date(contentObject.published_at),
    });
  });

  return feed.rss2();
}

export default Object.freeze({
  generateRss2,
});
