# Chess Compiler Learn Blog - Author Guide

Welcome to the Chess Compiler Learn blog! This guide explains how to write posts in markdown and how to embed interactive chess boards in your articles.

## Writing Posts

- All posts are written in standard Markdown (`.md`) files.
- Each post must start with YAML front matter, for example:

```
---
title: "How to Play Chess"
date: 2025-06-21
image: "https://example.com/chess.jpg"
layout: post
---
```

- Use regular markdown for headings, images, lists, code, etc.

## Embedding Chess Boards

You can embed an interactive chess board anywhere in your post using the custom `<chess-board>` tag. This works in markdown files and will be rendered automatically.

### Basic Usage

```
<chess-board fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"></chess-board>
```

- The `fen` attribute is required and should contain a valid FEN string.

### Highlighting Squares

To highlight squares, use the `highlight` attribute with a comma-separated list of squares:

```
<chess-board fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" highlight="e4,d4"></chess-board>
```

### Drawing Arrows

To draw arrows, use the `arrows` attribute with a comma-separated list of moves in the format `from-to`:

```
<chess-board fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" arrows="e2-e4,d2-d4"></chess-board>
```

### Combining Features

You can combine FEN, highlights, and arrows:

```
<chess-board fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" highlight="e4,d4" arrows="e2-e4,d2-d4"></chess-board>
```

- All attributes are optional except `fen`.
- The board will be rendered in-place in your post.

## Tips

- Use standard markdown for everything else.
- You can add as many chess boards as you like in a single post.
- For best results, use valid FEN strings and correct square names.

---

Happy writing and chess blogging!
