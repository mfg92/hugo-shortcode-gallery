---
title: "Gallery"
date: 2020-10-21T18:45:32+02:00
draft: false
---

Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.

Here is an example gallery:

{{< gallery
    match="images/*"
    showExif="true"
    sortOrder="desc"
    loadJQuery="true"
    embedPreview="true"
    filterOptions="[{label: 'All', tags: '.*'}, {label: 'Amphibian', tags: 'animal|amphibian'}]"
>}}


