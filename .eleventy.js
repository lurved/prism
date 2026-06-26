module.exports = function (eleventyConfig) {
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
      output:   ".",
      includes: "_includes",
      data:     "_data",
    },
    templateFormats: ["njk", "md"],
  };
};
