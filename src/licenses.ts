/**
 * The license catalog: twelve common open-source licenses, each with the
 * passages that identify it.
 *
 * Every entry carries two kinds of evidence:
 *
 * - `anchors`: short phrases that appear in this license and (almost)
 *   nowhere else — the MIT permission grant, the Apache "TERMS AND
 *   CONDITIONS" heading, the BSD third clause. Anchors identify a license
 *   from a short header where a full-text comparison has too little to
 *   work with.
 * - `template`: a representative passage of the license body, used for
 *   token-set similarity when a whole LICENSE file is on the table.
 *
 * Templates are excerpts, not the full legal text: the matcher needs the
 * distinctive vocabulary, not every paragraph.
 */

export type LicenseFamily = "permissive" | "copyleft" | "public-domain";

export interface LicenseTemplate {
  /** SPDX identifier, e.g. "MIT". */
  spdx: string;
  /** Human-readable name. */
  name: string;
  family: LicenseFamily;
  /** Distinctive phrases; stored raw, normalized before matching. */
  anchors: string[];
  /** Representative passage of the license body. */
  template: string;
}

export const LICENSES: LicenseTemplate[] = [
  {
    spdx: "MIT",
    name: "MIT License",
    family: "permissive",
    anchors: [
      "permission is hereby granted free of charge to any person obtaining a copy",
      "to deal in the software without restriction",
      "the software is provided as is without warranty of any kind",
      "mit license",
    ],
    template: `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions: The above copyright
notice and this permission notice shall be included in all copies or
substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`,
  },
  {
    spdx: "Apache-2.0",
    name: "Apache License 2.0",
    family: "permissive",
    anchors: [
      "licensed under the apache license version 2 0",
      "terms and conditions for use reproduction and distribution",
      "apache license",
      "you may obtain a copy of the license at http www apache org licenses license 2 0",
    ],
    template: `Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by
applicable law or agreed to in writing, software distributed under the License
is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License. TERMS AND CONDITIONS
FOR USE, REPRODUCTION, AND DISTRIBUTION. 1. Definitions. "License" shall mean
the terms and conditions for use, reproduction, and distribution as defined by
Sections 1 through 9 of this document. "Licensor" shall mean the copyright
owner or entity authorized by the copyright owner that is granting the
License. 2. Grant of Copyright License. Subject to the terms and conditions
of this License, each Contributor hereby grants to You a perpetual, worldwide,
non-exclusive, no-charge, royalty-free, irrevocable copyright license to
reproduce, prepare Derivative Works of, publicly display, publicly perform,
sublicense, and distribute the Work and such Derivative Works in Source or
Object form.`,
  },
  {
    spdx: "BSD-3-Clause",
    name: "BSD 3-Clause License",
    family: "permissive",
    anchors: [
      "redistribution and use in source and binary forms with or without modification are permitted",
      "neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote",
      "redistributions of source code must retain the above copyright notice",
    ],
    template: `Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer. 2. Redistributions in
binary form must reproduce the above copyright notice, this list of
conditions and the following disclaimer in the documentation and/or other
materials provided with the distribution. 3. Neither the name of the
copyright holder nor the names of its contributors may be used to endorse or
promote products derived from this software without specific prior written
permission. THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND
CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT
NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
  },
  {
    spdx: "BSD-2-Clause",
    name: "BSD 2-Clause License",
    family: "permissive",
    anchors: [
      "redistribution and use in source and binary forms with or without modification are permitted",
      "redistributions of source code must retain the above copyright notice",
      "redistributions in binary form must reproduce the above copyright notice",
    ],
    template: `Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer. 2. Redistributions in
binary form must reproduce the above copyright notice, this list of
conditions and the following disclaimer in the documentation and/or other
materials provided with the distribution. THIS SOFTWARE IS PROVIDED BY THE
COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
  },
  {
    spdx: "ISC",
    name: "ISC License",
    family: "permissive",
    anchors: [
      "permission to use copy modify and or distribute this software for any purpose with or without fee is hereby granted",
      "isc license",
    ],
    template: `Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies. THE
SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.`,
  },
  {
    spdx: "GPL-3.0-only",
    name: "GNU General Public License v3.0 only",
    family: "copyleft",
    anchors: [
      "gnu general public license version 3 29 june 2007",
      "the gnu general public license is a free copyleft license for software and other kinds of works",
      "everyone is permitted to copy and distribute verbatim copies of this license document but changing it is not allowed",
      "either version 3 of the license or at your option any later version",
    ],
    template: `GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007 Copyright (C) 2007 Free
Software Foundation, Inc. Everyone is permitted to copy and distribute
verbatim copies of this license document, but changing it is not allowed.
Preamble. The GNU General Public License is a free, copyleft license for
software and other kinds of works. The licenses for most software and other
practical works are designed to take away your freedom to share and change
the works. By contrast, the GNU General Public License is intended to
guarantee your freedom to share and change all versions of a program--to
make sure it remains free software for all its users. We, the Free Software
Foundation, use the GNU General Public License for most of our software; it
applies also to any other work released this way by its authors. You can
apply it to your programs, too. When we speak of free software, we are
referring to freedom, not price. Our General Public Licenses are designed to
make sure that you have the freedom to distribute copies of free software
(and charge for them if you wish), that you receive source code or can get
it if you want it, that you can change the software or use pieces of it in
new free programs, and that you know you can do these things. This program
is free software: you can redistribute it and/or modify it under the terms
of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version. This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
Public License for more details. THERE IS NO WARRANTY FOR THE PROGRAM, TO
THE EXTENT PERMITTED BY APPLICABLE LAW. EXCEPT WHEN OTHERWISE STATED IN
WRITING THE COPYRIGHT HOLDERS AND/OR OTHER PARTIES PROVIDE THE PROGRAM "AS
IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING,
BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
FOR A PARTICULAR PURPOSE. THE ENTIRE RISK AS TO THE QUALITY AND
PERFORMANCE OF THE PROGRAM IS WITH YOU. SHOULD THE PROGRAM PROVE
DEFECTIVE, YOU ASSUME THE COST OF ALL NECESSARY SERVICING, REPAIR OR
CORRECTION.`,
  },
  {
    spdx: "GPL-2.0-only",
    name: "GNU General Public License v2.0 only",
    family: "copyleft",
    anchors: [
      "gnu general public license version 2 june 1991",
      "the licenses for most software are designed to take away your freedom to share and change it",
      "gnu general public license is intended to guarantee your freedom to share and change free software",
      "either version 2 of the license or at your option any later version",
    ],
    template: `GNU GENERAL PUBLIC LICENSE Version 2, June 1991 Copyright (C) 1989, 1991
Free Software Foundation, Inc. 51 Franklin Street, Fifth Floor, Boston, MA
02110-1301, USA. Everyone is permitted to copy and distribute verbatim
copies of this license document, but changing it is not allowed. Preamble.
The licenses for most software are designed to take away your freedom to
share and change it. By contrast, the GNU General Public License is intended
to guarantee your freedom to share and change free software--to make sure
the software is free for all its users. This License applies to any program
or other work which contains a notice placed by the copyright holder saying
it may be distributed under the terms of this General Public License. The
"Program", below, refers to any such program or work, and a "work based on
the Program" means either the Program or any derivative work under
copyright law: that is to say, a work containing the Program or a portion of
it, either verbatim or with modifications and/or translated into another
language. This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or (at your
option) any later version. This program is distributed in the hope that it
will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
Public License for more details. BECAUSE THE PROGRAM IS LICENSED FREE OF
CHARGE, THERE IS NO WARRANTY FOR THE PROGRAM, TO THE EXTENT PERMITTED BY
APPLICABLE LAW. EXCEPT WHEN OTHERWISE STATED IN WRITING THE COPYRIGHT
HOLDERS AND/OR OTHER PARTIES PROVIDE THE PROGRAM "AS IS" WITHOUT WARRANTY
OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH
YOU. SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF ALL
NECESSARY SERVICING, REPAIR OR CORRECTION.`,
  },
  {
    spdx: "LGPL-3.0-only",
    name: "GNU Lesser General Public License v3.0 only",
    family: "copyleft",
    anchors: [
      "gnu lesser general public license version 3 29 june 2007",
      "this version of the gnu lesser general public license incorporates the terms and conditions of version 3 of the gnu general public license",
    ],
    template: `GNU LESSER GENERAL PUBLIC LICENSE Version 3, 29 June 2007 Copyright (C)
2007 Free Software Foundation, Inc. Everyone is permitted to copy and
distribute verbatim copies of this license document, but changing it is not
allowed. This version of the GNU Lesser General Public License incorporates
the terms and conditions of version 3 of the GNU General Public License,
supplemented by the additional permissions listed below. 0. Additional
Definitions. As used herein, "this License" refers to version 3 of the GNU
Lesser General Public License, and the "GNU GPL" refers to version 3 of the
GNU General Public License. "The Library" refers to a covered work governed
by this License, other than an Application or a Combined Work as defined
below.`,
  },
  {
    spdx: "AGPL-3.0-only",
    name: "GNU Affero General Public License v3.0 only",
    family: "copyleft",
    anchors: [
      "gnu affero general public license version 3 19 november 2007",
      "specifically designed to ensure cooperation with the community in the case of network server software",
      "gnu affero general public license is a free copyleft license",
    ],
    template: `GNU AFFERO GENERAL PUBLIC LICENSE Version 3, 19 November 2007 Copyright
(C) 2007 Free Software Foundation, Inc. Everyone is permitted to copy and
distribute verbatim copies of this license document, but changing it is not
allowed. Preamble. The GNU Affero General Public License is a free, copyleft
license for software and other kinds of works, specifically designed to
ensure cooperation with the community in the case of network server
software. The licenses for most software and other practical works are
designed to take away your freedom to share and change the works. By
contrast, our General Public Licenses are intended to guarantee your freedom
to share and change all versions of a program--to make sure it remains free
software for all its users.`,
  },
  {
    spdx: "MPL-2.0",
    name: "Mozilla Public License 2.0",
    family: "copyleft",
    anchors: [
      "mozilla public license version 2 0",
      "this source code form is subject to the terms of the mozilla public license v 2 0",
      "contributor means each individual or legal entity that creates contributes to the creation of or owns covered software",
    ],
    template: `Mozilla Public License Version 2.0. 1. Definitions. 1.1. "Contributor" means
each individual or legal entity that creates, contributes to the creation
of, or owns Covered Software. 1.2. "Contributor Version" means the combination
of the Contributions of others (if any) used by a Contributor and that
particular Contributor's Contribution. 1.3. "Contribution" means Covered
Software of a particular Contributor. 1.4. "Covered Software" means Source
Code Form to which the initial Contributor has attached the notice in
Exhibit A, the Executable Form as set out in Section 3.2, and Modifications,
in each case including portions thereof. 1.5. "Incompatible With Secondary
Licenses" means that the initial Contributor has attached the notice
described in Exhibit B to the Covered Software; or that the Covered Software
was made available under the terms of version 1.1 or earlier of the License,
but not also under the terms of a Secondary License.`,
  },
  {
    spdx: "Unlicense",
    name: "The Unlicense",
    family: "public-domain",
    anchors: [
      "this is free and unencumbered software released into the public domain",
      "anyone is free to copy modify publish use compile sell or distribute this software",
      "for more information please refer to http unlicense org",
    ],
    template: `This is free and unencumbered software released into the public domain.
Anyone is free to copy, modify, publish, use, compile, sell, or distribute
this software, either in source code form or as a compiled binary, for any
purpose, commercial or non-commercial, and by any means. In jurisdictions
that recognize copyright laws, the author or authors of this software
dedicate any and all copyright interest in the software to the public domain.
We make this dedication for the benefit of the public at large and to the
detriment of our heirs and successors. We intend this dedication to be an
overt act of relinquishment in perpetuity of all present and future rights
to this software under copyright law. THE SOFTWARE IS PROVIDED "AS IS",
WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
USE OR OTHER DEALINGS IN THE SOFTWARE. For more information, please refer to
<http://unlicense.org/>`,
  },
  {
    spdx: "CC0-1.0",
    name: "Creative Commons Zero v1.0 Universal",
    family: "public-domain",
    anchors: [
      "cc0 1 0 universal",
      "the person who associated a work with this deed has dedicated the work to the public domain",
      "waiving all of his or her rights to the work worldwide under copyright law",
    ],
    template: `CC0 1.0 Universal. Statement of Purpose. The laws of most jurisdictions
throughout the world automatically confer exclusive Copyright and Related
Rights (defined below) upon the creator and subsequent owner(s) (each and
all, an "owner") of an original work of authorship and/or a database (each,
a "Work"). Certain owners wish to permanently relinquish those rights to a
Work for the purpose of contributing to a commons of creative, cultural and
scientific works ("Commons") that the public can reliably and without fear
of later claims of infringement build upon, modify, incorporate in other
works, reuse and redistribute as freely as possible in any form whatsoever
and for any purposes, including without limitation commercial purposes. These
owners may contribute to the Commons to promote the ideal of a free culture
and the further production of creative, cultural and scientific works, or to
gain reputation or greater distribution for their Work in part through the
use and efforts of others. 1. Copyright and Related Rights. A Work made
available under CC0 may be protected by copyright and related or
neighboring rights ("Copyright and Related Rights").`,
  },
];

/** Look a license up by SPDX id (case-insensitive). */
export function findLicense(spdx: string): LicenseTemplate | undefined {
  const wanted = spdx.trim().toLowerCase();
  return LICENSES.find((lic) => lic.spdx.toLowerCase() === wanted);
}

/** All SPDX identifiers the detector knows, in catalog order. */
export function knownSpdxIds(): string[] {
  return LICENSES.map((lic) => lic.spdx);
}
