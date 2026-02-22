if (!("HSCGjQuery" in window)) {
  if (!window.jQuery) {
    throw new Error(
      "jQuery is not loaded, hugo-shortcode-gallery wont work without it!"
    );
  }
  window.HSCGjQuery = window.jQuery.noConflict(true);
}

// Isolate all our variables from other scripts.
// See: https://www.nicoespeon.com/en/2013/05/properly-isolate-variables-in-javascript/
// We also expect to get jQuery as a parameter, so that if a second instance of jQuery is loaded
// after this script is executed (e.g. by a Hugo theme), we will still be referencing the previous
// version of jQuery that has all our plugins loaded.
(function ($) {
  window.hugoShortcodeGallery = {
    init: function (options) {
      const gallery = $("#" + options.galleryId);
      const wrapper = $("#" + options.galleryWrapperId);

      // The instance of swipebox, it will be set once justifiedGallery is initialized.
      let swipeboxInstance = null;

      // Before the gallery initialization, the listener has to be added,
      // else we can get a race condition and the listener is never called.
      gallery.on("jg.complete", () => {
        // If there is already some low-resolution image data loaded, then we will wait for loading
        // the hi-res until the justified gallery has done the layout.
        if (options.previewType === "blur" || options.previewType === "color") {
          gallery.find(".lazy").Lazy({
            visibleOnly: true,
            // The class lazy-blur is removed, so the blur filter is removed.
            afterLoad: (element) => element.removeClass("lazy-blur"),
          });
        }

        swipeboxInstance = gallery
          .find(".galleryImg")
          .swipebox($.extend({}, options.swipeboxParameters));
      });

      // Initialize the justified gallery.
      gallery.justifiedGallery(
        $.extend(
          {
            rowHeight: options.rowHeight,
            margins: options.margins,
            border: 0,
            randomize: options.randomize,
            waitThumbnailsLoad: false,
            lastRow: options.lastRow,
            captions: false,
            // If there is at least one filter option, we first show no images at all
            // until the code way below selects a filter and applies it.
            // This prevents creating the layout twice.
            filter:
              options.filterOptions && options.filterOptions.length > 0
                ? () => false
                : (e) => e,
          },
          options.justifiedGalleryParameters
        )
      );

      // Only include JS code for filter options if there is at least one filter option.
      if (options.filterOptions && options.filterOptions.length > 0) {
        // This function can be used to create a function that can be used by justifiedGallery
        // for filtering images by their metadata.
        function createMetadataFilter(filterFunction) {
          return (entry, index, array) => {
            let meta = $(entry).find("a").attr("data-meta");
            meta = meta ? JSON.parse(meta) : {};

            let include = filterFunction(meta);

            // Only those images visible in justified gallery should be displayed
            // in swipebox (only <a> with class galleryImg are displayed in swipebox).
            $(entry).find("a").toggleClass("galleryImg", include);

            return include;
          };
        }

        // This function returns a function that can be used by justifiedGallery
        // for filtering images by their tags.
        function createTagFilter(tagsRegexString) {
          const tagsRegex = RegExp(tagsRegexString);
          return createMetadataFilter((meta) => {
            let tags = meta.Tags;
            tags = tags ? tags : [];
            return tags.some((tag) => tagsRegex.test(tag));
          });
        }

        // This function returns a function that can be used by justifiedGallery
        // for filtering images by their description.
        function createImageDescriptionFilter(descriptionRegexString) {
          const descriptionRegex = RegExp(descriptionRegexString);
          return createMetadataFilter((meta) => {
            let imageDescription = meta.ImageDescription;
            return (
              imageDescription !== null &&
              descriptionRegex.test(imageDescription)
            );
          });
        }

        // This function returns a function that can be used by justifiedGallery
        // for filtering images by their star rating.
        function createRatingFilter(min, max) {
          return createMetadataFilter((meta) => {
            let rating = meta.Rating;
            if (rating === null) {
              rating = -1;
            }
            return rating >= min && rating <= max;
          });
        }

        // This function returns a function that can be used by justifiedGallery
        // for filtering images by their color labels.
        function createColorLabelFilter(color) {
          color = color.charAt(0).toLowerCase();
          return createMetadataFilter((meta) => {
            let colors = meta.ColorLabels;
            return colors && colors.includes(color);
          });
        }

        // Insert a div for inserting filter buttons before the gallery.
        const filterBar = $("<div class='justified-gallery-filterbar'/>");
        gallery.before(filterBar);

        function setFulltab(activate) {
          if (activate == wrapper.hasClass("fulltab")) {
            return; // Nothing to do, we are already in the right state.
          }

          wrapper.toggleClass("fulltab");
          gallery.justifiedGallery({
            rowHeight: options.rowHeight * (activate ? 1.5 : 1.0),
            lastRow: activate ? "nojustify" : options.lastRow,
            // Force justifiedGallery to refresh.
            refreshTime: 0,
          });
          // Force justifiedGallery to refresh.
          gallery.data("jg.controller").startImgAnalyzer();
          fullTabButton.html(
            wrapper.hasClass("fulltab")
              ? options.compressIcon
              : options.expandIcon
          );
        }

        const fullTabButton = $("<button/>");
        fullTabButton.html(options.expandIcon);
        fullTabButton.click(() => setFulltab(!wrapper.hasClass("fulltab")));
        filterBar.append(fullTabButton);
        $(document).keyup((e) => {
          // When ESC is pressed.
          if (e.keyCode === 27) {
            setFulltab(false);
          }
        });

        function activateFilterButton(filterButton) {
          // Activate associated filter.
          gallery.justifiedGallery({ filter: filterButton.filter });
          // Remove select class from all other selected buttons.
          filterBar.find(".selected").removeClass("selected");
          filterButton.addClass("selected");
        }

        // Check if the url contains an instruction to apply a specific filter,
        // e.g., example.com/images/#gallery-filter=Birds
        const params = new URLSearchParams(location.hash.replace(/^\#/, ""));
        let activeFilter = params.get("gallery-filter");
        if (!activeFilter) {
          // Default to first filter.
          activeFilter = options.filterOptions[0].label;
        }

        // Create a button for each filter entry.
        options.filterOptions.forEach((filterConfig) => {
          let filter; // Create a filter function based on the available attributes of filterConfig.
          if (filterConfig.tags) {
            filter = createTagFilter(filterConfig.tags);
          } else if (filterConfig.rating) {
            let minMax;
            if (filterConfig.rating.includes("-")) {
              minMax = filterConfig.rating.split("-"); // e.g., "3-5"
            } else {
              minMax = [filterConfig.rating, filterConfig.rating]; // e.g., "4"
            }
            filter = createRatingFilter(
              parseInt(minMax[0]),
              parseInt(minMax[1])
            );
          } else if (filterConfig.color_label) {
            filter = createColorLabelFilter(filterConfig.color_label);
          } else if (filterConfig.description) {
            filter = createImageDescriptionFilter(filterConfig.description);
          } else {
            // Default to always true filter.
            filter = createMetadataFilter((meta) => true);
          }

          const filterButton = $("<button/>");
          filterButton.text(filterConfig.label);
          filterButton.filter = filter;
          filterButton.click(() => {
            activateFilterButton(filterButton);

            if (options.storeSelectedFilterInUrl) {
              // Save applied filter in browser url.
              const params = new URLSearchParams(
                location.hash.replace(/^\#/, "")
              );
              params.set("gallery-filter", filterConfig.label);
              window.history.replaceState(
                "",
                "",
                location.pathname + location.search + "#" + params.toString()
              );
            }
          });
          filterBar.append(filterButton);

          if (filterConfig.label.toLowerCase() === activeFilter.toLowerCase()) {
            activateFilterButton(filterButton);
          }
        });
      }
    },
  };

  // We need to wait for the document to be ready, because this script is loaded in the head
  // and the gallery div is not yet present in the DOM.
  $(document).ready(function () {
    // This is the first script that is loaded, so we can be sure that this is the only
    // gallery script that is running. We can therefore initialize all galleries at once.
    $(".gallery-wrapper").each(function () {
      const wrapper = $(this);
      const optionsElement = wrapper.find(".gallery-options");
      const options = {
        galleryId: optionsElement.data("gallery-id"),
        galleryWrapperId: optionsElement.data("gallery-wrapper-id"),
        rowHeight: optionsElement.data("row-height"),
        margins: optionsElement.data("margins"),
        randomize: optionsElement.data("randomize"),
        lastRow: optionsElement.data("last-row"),
        justifiedGalleryParameters: optionsElement.data(
          "justified-gallery-parameters"
        ),
        swipeboxParameters: optionsElement.data("swipebox-parameters"),
        filterOptions: optionsElement.data("filter-options"),
        storeSelectedFilterInUrl: optionsElement.data(
          "store-selected-filter-in-url"
        ),
        previewType: optionsElement.data("preview-type"),
        expandIcon: optionsElement.data("expand-icon"),
        compressIcon: optionsElement.data("compress-icon"),
      };
      window.hugoShortcodeGallery.init(options);
    });
  });

  // End of our variable-isolating and self-executing anonymous function.
  // We call it with the one version of jQuery that was used to load our plugins.
  // See: http://blog.nemikor.com/2009/10/03/using-multiple-versions-of-jquery/
})(window.HSCGjQuery);
