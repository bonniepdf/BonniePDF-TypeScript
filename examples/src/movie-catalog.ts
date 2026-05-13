import { Document, DocumentSettings, DocumentMetadata, PdfSize, PageOrientation, PdfVersion, TextBlock, TextAlignment, VerticalStack, Table, TableRow, Color, Border, BorderColors, StandardFonts, asCell, cellBackground, cellPadding, cellBorder } from '@bonniepdf/core'

interface Movie {
  year: number;
  title: string;
  director: string;
  genre: string;
  rating: number;
  duration: string;
}

const MOVIES: Movie[] = [
  { year: 1941, title: 'Citizen Kane', director: 'Orson Welles', genre: 'Drama', rating: 8.3, duration: '119 min' },
  { year: 1942, title: 'Casablanca', director: 'Michael Curtiz', genre: 'Drama/Romance', rating: 8.5, duration: '102 min' },
  { year: 1946, title: "It's a Wonderful Life", director: 'Frank Capra', genre: 'Drama/Fantasy', rating: 8.6, duration: '130 min' },
  { year: 1950, title: 'Sunset Boulevard', director: 'Billy Wilder', genre: 'Drama/Noir', rating: 8.4, duration: '110 min' },
  { year: 1952, title: "Singin' in the Rain", director: 'Stanley Donen, Gene Kelly', genre: 'Musical/Comedy', rating: 8.3, duration: '103 min' },
  { year: 1954, title: 'Rear Window', director: 'Alfred Hitchcock', genre: 'Thriller/Mystery', rating: 8.5, duration: '112 min' },
  { year: 1954, title: 'Seven Samurai', director: 'Akira Kurosawa', genre: 'Action/Drama', rating: 8.6, duration: '207 min' },
  { year: 1957, title: '12 Angry Men', director: 'Sidney Lumet', genre: 'Drama', rating: 9.0, duration: '96 min' },
  { year: 1957, title: 'The Bridge on the River Kwai', director: 'David Lean', genre: 'Adventure/Drama', rating: 8.1, duration: '161 min' },
  { year: 1958, title: 'Vertigo', director: 'Alfred Hitchcock', genre: 'Mystery/Romance', rating: 8.3, duration: '128 min' },
  { year: 1959, title: 'North by Northwest', director: 'Alfred Hitchcock', genre: 'Action/Thriller', rating: 8.4, duration: '136 min' },
  { year: 1960, title: 'Psycho', director: 'Alfred Hitchcock', genre: 'Horror/Thriller', rating: 8.5, duration: '109 min' },
  { year: 1960, title: 'Spartacus', director: 'Stanley Kubrick', genre: 'Adventure/Drama', rating: 7.9, duration: '197 min' },
  { year: 1962, title: 'To Kill a Mockingbird', director: 'Robert Mulligan', genre: 'Drama', rating: 8.5, duration: '129 min' },
  { year: 1964, title: 'Dr. Strangelove', director: 'Stanley Kubrick', genre: 'Comedy/Sci-Fi', rating: 8.4, duration: '95 min' },
  { year: 1966, title: 'The Good, the Bad and the Ugly', director: 'Sergio Leone', genre: 'Western', rating: 8.8, duration: '178 min' },
  { year: 1967, title: 'The Graduate', director: 'Mike Nichols', genre: 'Drama/Romance', rating: 7.9, duration: '106 min' },
  { year: 1968, title: '2001: A Space Odyssey', director: 'Stanley Kubrick', genre: 'Sci-Fi/Adventure', rating: 8.3, duration: '149 min' },
  { year: 1969, title: 'Butch Cassidy and the Sundance Kid', director: 'George Roy Hill', genre: 'Biography/Drama', rating: 8.0, duration: '110 min' },
  { year: 1971, title: 'The French Connection', director: 'William Friedkin', genre: 'Action/Crime', rating: 7.8, duration: '104 min' },
  { year: 1972, title: 'The Godfather', director: 'Francis Ford Coppola', genre: 'Crime/Drama', rating: 9.2, duration: '175 min' },
  { year: 1974, title: 'The Godfather Part II', director: 'Francis Ford Coppola', genre: 'Crime/Drama', rating: 9.0, duration: '202 min' },
  { year: 1975, title: "One Flew Over the Cuckoo's Nest", director: 'Milos Forman', genre: 'Drama', rating: 8.7, duration: '133 min' },
  { year: 1976, title: 'Taxi Driver', director: 'Martin Scorsese', genre: 'Drama/Thriller', rating: 8.2, duration: '114 min' },
  { year: 1977, title: 'Star Wars: Episode IV', director: 'George Lucas', genre: 'Action/Sci-Fi', rating: 8.6, duration: '121 min' },
  { year: 1979, title: 'Apocalypse Now', director: 'Francis Ford Coppola', genre: 'Drama/War', rating: 8.5, duration: '147 min' },
  { year: 1980, title: 'Raging Bull', director: 'Martin Scorsese', genre: 'Biography/Drama', rating: 8.2, duration: '129 min' },
  { year: 1980, title: 'The Empire Strikes Back', director: 'Irvin Kershner', genre: 'Action/Sci-Fi', rating: 8.7, duration: '124 min' },
  { year: 1981, title: 'Raiders of the Lost Ark', director: 'Steven Spielberg', genre: 'Action/Adventure', rating: 8.4, duration: '115 min' },
  { year: 1984, title: 'Amadeus', director: 'Milos Forman', genre: 'Biography/Drama', rating: 8.4, duration: '160 min' },
  { year: 1984, title: 'This Is Spinal Tap', director: 'Rob Reiner', genre: 'Comedy/Music', rating: 7.9, duration: '82 min' },
  { year: 1985, title: 'Back to the Future', director: 'Robert Zemeckis', genre: 'Adventure/Comedy', rating: 8.5, duration: '116 min' },
  { year: 1986, title: 'Aliens', director: 'James Cameron', genre: 'Action/Sci-Fi', rating: 8.5, duration: '137 min' },
  { year: 1987, title: 'Princess Bride', director: 'Rob Reiner', genre: 'Adventure/Comedy', rating: 8.0, duration: '98 min' },
  { year: 1988, title: 'Die Hard', director: 'John McTiernan', genre: 'Action/Thriller', rating: 8.2, duration: '132 min' },
  { year: 1989, title: 'Do the Right Thing', director: 'Spike Lee', genre: 'Drama', rating: 7.9, duration: '120 min' },
  { year: 1989, title: 'When Harry Met Sally...', director: 'Rob Reiner', genre: 'Comedy/Romance', rating: 7.7, duration: '96 min' },
  { year: 1991, title: 'The Silence of the Lambs', director: 'Jonathan Demme', genre: 'Crime/Drama', rating: 8.6, duration: '118 min' },
  { year: 1992, title: 'Reservoir Dogs', director: 'Quentin Tarantino', genre: 'Crime/Drama', rating: 8.3, duration: '99 min' },
  { year: 1993, title: "Schindler's List", director: 'Steven Spielberg', genre: 'Biography/Drama', rating: 9.0, duration: '195 min' },
  { year: 1994, title: 'Pulp Fiction', director: 'Quentin Tarantino', genre: 'Crime/Drama', rating: 8.9, duration: '154 min' },
  { year: 1994, title: 'The Shawshank Redemption', director: 'Frank Darabont', genre: 'Drama', rating: 9.3, duration: '142 min' },
  { year: 1995, title: 'Se7en', director: 'David Fincher', genre: 'Crime/Drama', rating: 8.6, duration: '127 min' },
  { year: 1997, title: 'Titanic', director: 'James Cameron', genre: 'Drama/Romance', rating: 7.9, duration: '194 min' },
  { year: 1998, title: 'The Big Lebowski', director: 'Joel Coen', genre: 'Comedy/Crime', rating: 8.1, duration: '117 min' },
  { year: 1999, title: 'Fight Club', director: 'David Fincher', genre: 'Drama', rating: 8.8, duration: '139 min' },
  { year: 1999, title: 'The Matrix', director: 'The Wachowskis', genre: 'Action/Sci-Fi', rating: 8.7, duration: '136 min' },
];

export function generate(): Document {
  const now = new Date();
  const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape, 40);
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'Classic Movies Collection';
  metadata.author = 'Classic Cinema Archive';

  const doc = new Document(settings, metadata);

  // ── Title section ──
  const titleStack = new VerticalStack();

  const titleText = new TextBlock('Classic Movies Collection');
  titleText.fontName = StandardFonts.TimesBold;
  titleText.fontSize = 26;
  titleText.textColor = Color.slate900;
  titleStack.addChild(titleText);

  const tagline = new TextBlock('A curated selection of timeless cinema from the golden age of Hollywood');
  tagline.fontName = StandardFonts.TimesItalic;
  tagline.fontSize = 12;
  tagline.textColor = Color.slate600;
  titleStack.addChild(tagline);

  const countLine = new TextBlock(`Total Movies: ${MOVIES.length} | Compiled: ${monthYear}`);
  countLine.fontName = StandardFonts.Helvetica;
  countLine.fontSize = 10;
  countLine.textColor = Color.slate500;
  titleStack.addChild(countLine);

  // ── Movies table ──
  const moviesTable = new Table(1, 3, 4, 2, 1.5, 2);
  moviesTable.cellPadding = 8;
  moviesTable.border = new Border(0.5);
  moviesTable.borderColors = new BorderColors(Color.slate400);
  moviesTable.headerBackgroundColor = Color.indigo800;
  moviesTable.headerTextColor = Color.white;
  moviesTable.repeatHeadersOnNewPage = true;

  const hYear = new TextBlock('Year'); hYear.fontName = StandardFonts.HelveticaBold; hYear.fontSize = 10; hYear.alignment = TextAlignment.Center;
  const hTitle = new TextBlock('Title'); hTitle.fontName = StandardFonts.HelveticaBold; hTitle.fontSize = 10;
  const hDirector = new TextBlock('Director'); hDirector.fontName = StandardFonts.HelveticaBold; hDirector.fontSize = 10;
  const hGenre = new TextBlock('Genre'); hGenre.fontName = StandardFonts.HelveticaBold; hGenre.fontSize = 10;
  const hRating = new TextBlock('Rating'); hRating.fontName = StandardFonts.HelveticaBold; hRating.fontSize = 10; hRating.alignment = TextAlignment.Center;
  const hDuration = new TextBlock('Duration'); hDuration.fontName = StandardFonts.HelveticaBold; hDuration.fontSize = 10; hDuration.alignment = TextAlignment.Center;
  moviesTable.addHeader(hYear, hTitle, hDirector, hGenre, hRating, hDuration);

  MOVIES.forEach((movie, rowIndex) => {
    const ratingColor = movie.rating >= 9.0 ? Color.green600 : movie.rating >= 7.5 ? Color.amber600 : Color.slate600;
    const ratingBg = movie.rating >= 9.0 ? Color.green50 : movie.rating >= 7.5 ? Color.amber50 : Color.slate100;
    const rowBg = rowIndex % 2 === 0 ? Color.white : Color.slate50;

    const yearText = new TextBlock(String(movie.year));
    yearText.fontName = StandardFonts.CourierBold;
    yearText.fontSize = 10;
    yearText.textColor = Color.indigo700;
    yearText.alignment = TextAlignment.Center;

    const titleCell = new TextBlock(movie.title);
    titleCell.fontName = StandardFonts.HelveticaBold;
    titleCell.fontSize = 10;
    titleCell.textColor = Color.slate900;

    const directorText = new TextBlock(movie.director);
    directorText.fontName = StandardFonts.Helvetica;
    directorText.fontSize = 10;
    directorText.textColor = Color.slate700;

    const genreText = new TextBlock(movie.genre);
    genreText.fontName = StandardFonts.Helvetica;
    genreText.fontSize = 9;
    genreText.textColor = Color.slate600;

    const ratingText = new TextBlock(movie.rating.toFixed(1));
    ratingText.fontName = StandardFonts.HelveticaBold;
    ratingText.fontSize = 10;
    ratingText.textColor = ratingColor;
    ratingText.alignment = TextAlignment.Center;
    const ratingCell = cellBorder(cellPadding(cellBackground(asCell(ratingText), ratingBg), 4), Color.slate300, 0.5);

    const durText = new TextBlock(movie.duration);
    durText.fontName = StandardFonts.Courier;
    durText.fontSize = 9;
    durText.textColor = Color.slate600;
    durText.alignment = TextAlignment.Center;

    const row = TableRow.fromElements(yearText, titleCell, directorText, genreText, ratingCell, durText);
    row.withBackground(rowBg);
    moviesTable.addRowRow(row);
  });

  // ── Statistics section ──
  const statsStack = new VerticalStack();

  const statsTitle = new TextBlock('Collection Statistics');
  statsTitle.fontName = StandardFonts.HelveticaBold;
  statsTitle.fontSize = 12;
  statsTitle.textColor = Color.slate800;
  statsStack.addChild(statsTitle);

  const avgRating = MOVIES.reduce((s, m) => s + m.rating, 0) / MOVIES.length;
  const topRated = [...MOVIES].sort((a, b) => b.rating - a.rating)[0];
  const earliest = [...MOVIES].sort((a, b) => a.year - b.year)[0];
  const latest = [...MOVIES].sort((a, b) => b.year - a.year)[0];

  for (const text of [
    `- Average Rating: ${avgRating.toFixed(1)}/10`,
    `- Top Rated: ${topRated.title} (${topRated.rating.toFixed(1)})`,
    `- Year Range: ${earliest.year} - ${latest.year}`,
    '- Most Represented Genre: Drama',
  ]) {
    const t = new TextBlock(text);
    t.fontName = StandardFonts.Helvetica;
    t.fontSize = 10;
    t.textColor = Color.slate700;
    statsStack.addChild(t);
  }

  // ── Footer ──
  const footer = new TextBlock(
    `© ${now.getFullYear()} Classic Cinema Archive. All rights reserved. | Films listed for educational purposes.`
  );
  footer.fontName = StandardFonts.HelveticaOblique;
  footer.fontSize = 8;
  footer.textColor = Color.slate400;

  // ── Assemble ──
  const mainStack = new VerticalStack();
  mainStack.addChild(titleStack);
  mainStack.addChild(moviesTable);
  mainStack.addChild(statsStack);
  mainStack.addChild(footer);

  doc.add(mainStack);

  return doc;
}