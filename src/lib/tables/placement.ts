// Where a table sits in the hierarchy a list page draws, and which levels of it the page draws. Shared by the pages
// that draw the hierarchy (MenuPage, SectorPage) and the crumbs that lead back into it (PageCrumbs), so a crumb never
// points at a level that is not on the page.

// LIB =================================================================================================================
import { CatalogueEntry, EntryGroup, Section, Sector, slugify } from "@/lib/api/catalogue";

// A level is drawn as a column only when it has a name and siblings: the only part of a sector, or the only group of a
// part, adds nothing the level above does not say, so its tables sit one column up.
export const sectionShown = (sector : Sector, section : Section) : boolean => !section.implicit && sector.sections.length > 1;
export const groupShown   = (section : Section, group : EntryGroup) : boolean => group.label !== "" && section.groups.length > 1;

// Anchors on a menu page (sectors, then parts, then groups) and on a theme page (parts, then groups). Sector slugs are
// unique in a menu, section slugs in a sector and group labels in a section, so each id is unique on its page.
export const menuSectionAnchor = (sector : Sector, section : Section) : string => `${sector.slug}--${section.slug}`;
export const menuGroupAnchor   = (sector : Sector, section : Section, group : EntryGroup) : string =>
    `${menuSectionAnchor(sector, section)}--${slugify(group.label)}`;
export const themeGroupAnchor  = (section : Section, group : EntryGroup) : string => `${section.slug}--${slugify(group.label)}`;

// A table and the levels it sits under.
export interface Placement {
    entry   : CatalogueEntry;
    sector  : Sector;
    section : Section;
    group   : EntryGroup;
}

// The first table among the sectors that matches, with its levels; null when none does.
export function findPlacement(sectors : Sector[], match : (entry : CatalogueEntry) => boolean) : Placement | null {
    for (const sector of sectors) {
        for (const section of sector.sections) {
            for (const group of section.groups) {
                const entry = group.entries.find(match);
                if (entry) return { entry, sector, section, group };
            }
        }
    }
    return null;
}
