const reserved = new Set(
  'await break case catch class const continue debugger default delete do else enum export extends false finally for function if implements import in instanceof interface let namespace new null package private protected public return static super switch this throw true try typeof var void while with yield abstract as base bool byte char checked decimal delegate double event explicit extern fixed float foreach goto implicit int internal is lock long object operator out override params readonly ref sbyte sealed short sizeof stackalloc string struct uint ulong unchecked unsafe ushort using virtual volatile'.split(
    ' '
  )
);
export const isPortableIdentifier = (value: string): boolean =>
  /^[A-Za-z_][A-Za-z0-9_]*$/.test(value) && !reserved.has(value);
