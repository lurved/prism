module.exports = function (eleventyConfig) {
  // Pass through all existing static site files unchanged
  const passthrough = [
    "index.html", "about.html", "home.css", "style.css",
    "chat-widget.js", "blog.css", "logo.svg", "logo.png", "favicon.png",
    "sides", "typeme", "agent", "notes/images",
    // sustainability: only static subfolders (report_comparison is a separate Vercel app)
    "sustainability/index.html", "sustainability/sr2026",
  ];
  passthrough.forEach(p => eleventyConfig.addPassthroughCopy(p));

  // Blog posts collection, newest first
  eleventyConfig.addCollection("notes", api =>
    api.getFilteredByGlob("notes/*.md").reverse()
  );

  // Readable date filter
  eleventyConfig.addFilter("readableDate", date =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric"
    })
  );

  return {
    dir: {
      input:    ".",
      output:   "_site",
      includes: "_includes",
      data:     "_data",
    },
    templateFormats: ["njk", "md"],
  };
};
