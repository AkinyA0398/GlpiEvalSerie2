// Temporary debug helpers for ticket ↔ linked items resolution.
// Not used by production runtime.

export const candidateGetPaths = ({ GLPI_TICKET_ITEMTYPE, ticketId }) => [
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/Computer`,
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/Monitor`,
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/Computer?range=0-200`,
    `/${GLPI_TICKET_ITEMTYPE}/${ticketId}/Monitor?range=0-200`,
];

