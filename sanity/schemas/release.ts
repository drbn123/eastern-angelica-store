import { defineField, defineType } from "sanity";

export default defineType({
  name: "release",
  title: "Release",
  type: "document",
  fields: [
    defineField({ name: "id", title: "Catalog ID", type: "string" }),
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({ name: "artist", title: "Artist", type: "string" }),
    defineField({
      name: "format",
      title: "Format",
      type: "string",
      options: {
        list: ["LP", '12"', '7"', "CD", "CS", "TEE", "LS", "BOOK"],
      },
    }),
    defineField({ name: "edition", title: "Edition", type: "string" }),
    defineField({ name: "year", title: "Year", type: "string" }),
    defineField({ name: "cat", title: "Cat. Number", type: "string" }),
    defineField({ name: "price", title: "Base price (€)", type: "number" }),
    defineField({
      name: "variants",
      title: "Variants",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "k", title: "Name", type: "string" }),
            defineField({ name: "p", title: "Price (€)", type: "number" }),
          ],
        },
      ],
    }),
    defineField({ name: "tag", title: "Tag", type: "string" }),
    defineField({ name: "cover", title: "Cover image", type: "image" }),
    defineField({ name: "desc", title: "Description", type: "text" }),
  ],
  preview: {
    select: { title: "title", subtitle: "artist" },
  },
});
