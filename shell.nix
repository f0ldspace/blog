{
  pkgs ? import <nixpkgs> { },
}:

pkgs.mkShell {
  buildInputs = with pkgs; [
    ruby_3_3
    bundler
    sqlite
    (python3.withPackages (ps: with ps; [
      ebooklib
      markdown
    ]))
  ];
}
