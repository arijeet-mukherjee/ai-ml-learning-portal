"use strict";
/**
 * The content model for the portal.
 *
 * Content is DATA, never JSX. A chapter is a typed object; `ContentRenderer` is the
 * only thing that knows how to draw a block. That separation is what lets a new module
 * be added by dropping one file in `src/content/chapters/` — see ADDING_NEW_MODULES.md.
 *
 * Block types mirror the markup conventions in the professor's own notebook
 * (bigidea / note+Memory hook / trap / world / genai / fix), so his material can be
 * carried across without flattening it into anonymous paragraphs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
