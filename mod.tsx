/** @jsx createElement */

import { createElement } from "https://deno.land/x/jsx4xml@v0.1.4/mod.ts";
import { formatRFC7231, parseISO } from "https://esm.sh/date-fns@2.28.0";

export const RssFeed = async (
  { userId, lang }: { userId: string; lang?: string },
) => {
  const data = await request(userId, lang);
  const allWorks = [data.illusts, data.manga, data.novels]
    .map((works) => Object.values(works)).flat()
    .sort((a, b) =>
      parseISO(a.updateDate, {}) - parseISO(b.updateDate, {})
    ) as PixivWork[];

  const lastBuildDate = allWorks?.[0].updateDate;

  return (
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      {/* <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"> */}
      <channel>
        {
          /* <atom:link
        href={`https://${creator.creatorId}.fanbox.cc/`}
        rel="self"
        type="application/rss+xml"
      /> */
        }
        <title>{data.extraData.meta.ogp.title}</title>
        <link>{data.extraData.meta.canonical}</link>
        <description>{data.extraData.meta.ogp.description}</description>
        <lastBuildDate>
          {lastBuildDate && validateDate(lastBuildDate)}
        </lastBuildDate>
        <image>
          <url>{data.extraData.meta.ogp.image}</url>
          <title>{data.extraData.meta.ogp.title}</title>
          <link>{data.extraData.meta.canonical}</link>
        </image>
        {await Promise.all(allWorks.map(async (work) => (
          <item>
            <title>{work.title}</title>
            <description>{work.description}</description>
            <link>
              {`https://www.pixiv.net/artworks/${work.id}`}
            </link>
            <guid>
              {`https://www.pixiv.net/artworks/${work.id}`}
            </guid>
            <category>
              {function (work) {
                if (isIllust(work)) {
                  if (work.illustType === IllustType.Illust) {
                    return "Illustlation";
                  } else if (work.illustType === IllustType.Manga) {
                    return "Manga";
                  }
                } else {
                  return "Novel";
                }
              }(work)}
            </category>
            <pubDate>{validateDate(work.createDate)}</pubDate>
            {await Enclosure({ work })}
            <source url={data.extraData.meta.canonical}>
              {data.extraData.meta.ogp.title}
            </source>
          </item>
        )))}
      </channel>
    </rss>
  );
};

enum IllustType {
  Illust = 0,
  Manga = 1,
}

function isIllust(work: PixivWork): work is PixivIllust<IllustType> {
  return "illustType" in work;
}

type PixivWork =
  | PixivIllust<IllustType>
  | PixivNovel;

interface PixivIllust<Type extends IllustType> {
  alt: string;
  createDate: string;
  description: string;
  height: number;
  id: string;
  illustType: Type;
  pageCount: number;
  profileImageUrl: string;
  restrict: number;
  tags: string[];
  title: string;
  updateDate: string;
  url: string;
  userId: string;
  userName: string;
  width: number;
  xRestrict: number;
}

interface PixivNovel {
  alt: string;
  createDate: string;
  description: string;
  id: string;
  isOriginal: boolean;
  pageCount: number;
  profileImageUrl: string;
  readingTime: number;
  restrict: number;
  tags: string[];
  title: string;
  updateDate: string;
  url: string;
  userId: string;
  userName: string;
  xRestrict: number;
}

interface PixivData {
  extraData: {
    meta: {
      alternateLanguages: {
        [langage: string]: string;
      };
      canonical: string;
      title: string;
      description: string;
      ogp: {
        description: string;
        image: string;
        title: string;
        type: string;
      };
    };
  };
  illusts: {
    [illustId: string]: PixivIllust<IllustType.Illust>;
  };
  manga: {
    [mangaId: string]: PixivIllust<IllustType.Manga>;
  };
  novels: {
    [novelId: string]: PixivNovel;
  };
}

export async function request(userId: string, lang?: string) {
  const data = await fetch(
    `https://www.pixiv.net/ajax/user/${userId}/profile/top` +
      (lang ? `?lang=${lang}` : ""),
  ).then((request) => request.json());
  return data.body as PixivData;
}

function validateDate(date: string): string {
  return formatRFC7231(parseISO(date, {}));
}

async function Enclosure({ work }: { work: PixivWork }) {
  let url;
  if (isIllust(work)) {
    url = `https://embed.pixiv.net/artwork.php?illust_id=${work.id}`;
  } else {
    url = `https://embed.pixiv.net/novel.php?id=${work.id}`;
  }

  const [type, length] = await fetch(url, { method: "HEAD" })
    .then((r) =>
      [
        r.headers.get("Content-Type"),
        r.headers.get("Content-Length"),
      ] as string[]
    );

  return <enclosure {...{ url, type, length }} />;
}
