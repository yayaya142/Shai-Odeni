# Image Handling

Use one of two image strategies:

- local images inside `assets/images/` when the asset should live with the site
- externally hosted images only when the remote URL is stable and embeddable in a normal `<img>` tag

## Recommended structure

- `assets/images/profile/` for profile or author images
- `assets/images/posts/` for post-specific images
- `assets/images/projects/` for project or page-level visuals

## Profile image naming

Use names that describe the role of the image, not only the person.

Recommended examples:

- `author-profile.jpg`
- `author-headshot.jpg`
- `site-author-portrait.jpg`

Preferred default for this site:

- `author-profile.jpg`

## Post Hero Images

For a top image in a post, use Chirpy's `image` front matter.

Example:

```yaml
image:
  path: "https://example.com/image.png"
  alt: "Short descriptive alt text"
```

Important:

- this places the image near the top of the post automatically
- this same image may also be used as the preview image on the home page card for that post
- use clear `alt` text

## Remote Image Rule

Do not assume that a public file URL can be embedded just because it opens in the browser.

The URL must behave like a direct image response for `<img src="...">`.

Check for:

- `content-type: image/...`
- no HTML wrapper page
- no cross-site embedding restrictions that block rendering on your domain

## Google Drive Rule

Do not use the normal Google Drive share page or the `drive.google.com/uc?...` URL as the default image source for posts.

Those URLs may resolve in the browser but still fail to render in the blog because Google can return headers that block cross-site embedding.

For Google-hosted images, prefer the direct `lh3.googleusercontent.com` image URL when available.

Working pattern:

```text
https://lh3.googleusercontent.com/d/FILE_ID=w2000
```

For the tested `Simple CTF` post image, the working form was:

```text
https://lh3.googleusercontent.com/d/1US5zaalGHinkvJRqSYPDqmJyVera0Bd_=w2000
```

Avoid using this as the post image source:

```text
https://drive.google.com/file/d/FILE_ID/view?usp=sharing
```

And avoid relying on this as the final embedded URL unless it has been verified in the browser on the actual site:

```text
https://drive.google.com/uc?export=view&id=FILE_ID
```

## Validation Checklist

Before publishing a post with a hero image, verify:

- the image renders on the post page
- the image also behaves correctly on the home page card if that post appears there
- the browser shows the actual image, not a broken placeholder
- the remote host is not forcing a blocked cross-origin resource policy
