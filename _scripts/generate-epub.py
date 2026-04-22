#!/usr/bin/env python3
"""Generate an EPUB from all blog posts in _posts/."""

import os
import re
import glob
from ebooklib import epub
import markdown

POSTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '_posts')
IMAGES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'images')
OUTPUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'f0ld-space-posts.epub')

MD_EXTENSIONS = ['footnotes', 'tables', 'fenced_code']

IMAGE_MEDIA_TYPES = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
}


def parse_frontmatter(content):
    """Parse YAML frontmatter using simple regex (no PyYAML dependency)."""
    if not content.startswith('---'):
        return {}, content

    parts = content.split('---', 2)
    if len(parts) < 3:
        return {}, content

    fm_text = parts[1]
    body = parts[2]

    meta = {}
    for line in fm_text.strip().split('\n'):
        match = re.match(r'^(\w+):\s*"?(.+?)"?\s*$', line)
        if match:
            key, value = match.group(1), match.group(2)
            meta[key] = value

    return meta, body


def collect_posts():
    """Collect and parse all blog posts, sorted chronologically (oldest first)."""
    posts = []
    for filepath in sorted(glob.glob(os.path.join(POSTS_DIR, '*.md'))):
        filename = os.path.basename(filepath)

        # Skip templates or drafts
        if filename.startswith('_'):
            continue

        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        meta, body = parse_frontmatter(content)

        title = meta.get('title', filename.replace('.md', ''))
        date = meta.get('date', '')[:10]  # YYYY-MM-DD

        posts.append({
            'title': title,
            'date': date,
            'body': body.strip(),
            'filename': filename,
        })

    return posts


def find_referenced_images(html_content):
    """Find image paths referenced in the HTML content."""
    pattern = r'(?:src|href)=["\']/?assets/images/([^"\']+)["\']'
    return re.findall(pattern, html_content)


def build_epub(posts):
    """Build the EPUB file from parsed posts."""
    book = epub.EpubBook()

    book.set_identifier('f0ld-space-blog-posts')
    book.set_title('f0ld.space - Blog Posts')
    book.set_language('en')
    book.add_author('f0ld')

    style = '''
    body { font-family: Georgia, serif; line-height: 1.6; color: #333; }
    h1 { font-size: 1.4em; margin-bottom: 0.2em; }
    .post-date { color: #888; font-size: 0.85em; margin-bottom: 1.5em; display: block; }
    pre { background: #f4f4f4; padding: 1em; overflow-x: auto; font-size: 0.85em; }
    code { font-family: monospace; font-size: 0.9em; }
    blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 1em; color: #555; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 0.4em 0.8em; text-align: left; }
    '''
    css = epub.EpubItem(uid='style', file_name='style/default.css',
                        media_type='text/css', content=style.encode('utf-8'))
    book.add_item(css)

    md = markdown.Markdown(extensions=MD_EXTENSIONS)

    chapters = []
    all_images = set()

    for i, post in enumerate(posts):
        md.reset()
        html_body = md.convert(post['body'])

        # Rewrite image paths to be relative within EPUB
        html_body = re.sub(
            r'(?:src|href)=["\']/?assets/images/([^"\']+)["\']',
            r'src="images/\1"',
            html_body
        )

        all_images.update(find_referenced_images(md.convert(post['body'])))

        chapter_html = f'''<html><head><link rel="stylesheet" href="style/default.css"/></head><body>
<h1>{post["title"]}</h1>
<span class="post-date">{post["date"]}</span>
{html_body}
</body></html>'''

        chapter = epub.EpubHtml(
            title=post['title'],
            file_name=f'chapter_{i:03d}.xhtml',
            lang='en'
        )
        chapter.content = chapter_html.encode('utf-8')
        chapter.add_item(css)
        book.add_item(chapter)
        chapters.append(chapter)

    # Embed referenced images
    for img_name in all_images:
        img_path = os.path.join(IMAGES_DIR, img_name)
        if os.path.exists(img_path):
            ext = os.path.splitext(img_name)[1].lower()
            media_type = IMAGE_MEDIA_TYPES.get(ext, 'application/octet-stream')
            with open(img_path, 'rb') as f:
                img_item = epub.EpubItem(
                    uid=f'img_{img_name}',
                    file_name=f'images/{img_name}',
                    media_type=media_type,
                    content=f.read()
                )
                book.add_item(img_item)

    book.toc = chapters
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())
    book.spine = ['nav'] + chapters

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    epub.write_epub(OUTPUT, book)
    print(f'EPUB generated: {OUTPUT} ({len(chapters)} posts)')


if __name__ == '__main__':
    posts = collect_posts()
    if not posts:
        print('No posts found in _posts/')
    else:
        build_epub(posts)
