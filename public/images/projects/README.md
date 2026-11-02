# Project images

Put project screenshots here and set `image` on the matching entry in
`app/data/projects.ts`:

```ts
image: '/images/projects/pastefy.webp',
imageAlt: 'Pastefy editor',
```

Both fields are optional. Without `image`, only the description and links appear.
Remote image URLs also work. Existing screenshots are referenced from julian.ad.
Images keep their aspect ratio; failed images are hidden automatically.
