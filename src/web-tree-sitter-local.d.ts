declare module 'web-tree-sitter' {
  namespace Parser {
    export interface SyntaxNode {
      type: string;
      startIndex: number;
      endIndex: number;
      startPosition: { row: number; column: number };
      endPosition: { row: number; column: number };
      children: SyntaxNode[];
      parent: SyntaxNode | null;
      childForFieldName(fieldName: string): SyntaxNode | null;
    }

    export interface Tree {
      rootNode: SyntaxNode;
      delete(): void;
    }

    export interface Language {}
  }

  interface Parser {
    parse(input: string | Parser.Input, oldTree?: Parser.Tree): Parser.Tree;
    setLanguage(language: Parser.Language): void;
    getLanguage(): Parser.Language;
    delete(): void;
  }

  interface ParserConstructor {
    new(): Parser;
    init(): Promise<void>;
    Language: {
      load(path: string): Promise<Parser.Language>;
    };
  }

  namespace Parser {
    export interface Input {
      (index: number, position?: Point): string | null;
    }

    export interface Point {
      row: number;
      column: number;
    }
  }

  const Parser: ParserConstructor;
  export = Parser;
}
