The user will pass arguments in the format: "Title | Description" or just "Title".
Parse $ARGUMENTS by splitting on " | " — the part before is the title, the part after (if present) is the body.

Create a GitHub issue with the parsed title and body (leave body empty if not provided):
  gh issue create --repo surfer-kim/blog-v2 --title "<title>" --body "<body>"

Then add it to the project Kanban board in the "Todo" column.
