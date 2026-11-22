# Exam-question tutorial coverage

## Current 62-question catalogue — 22 November 2026

The SQL presentation refinement uses semantic bordered HTML tables with captions, column headers and every original database value. SELECT field lists and combined WHERE conditions stay on one physical clause line. Problems 58, 61 and 62 now have 2, 3 and 3 lines respectively. Their original understanding/prediction identities and feedback remain intact: multiple questions on one clause keep separate answers, gates and saved positions. All 299 checkpoints are preserved.

Every tutorial now marks its fully passed final view with a green Tutorial complete badge and Completed footer. A brief local confetti drop celebrates once per problem per open attempt. The final code/tutor/question or stage-review content remains in place; no completion screen or extra frame replaces it. Back remains available, Close clears the attempt, interruption removes the confetti, and reduced motion retains only the completion status.

This refinement was checked in Edge for all five SQL tables at desktop 1054×619, phone 320×740 and landscape 844×390, including every table cell and fitted exam page. Full SQL flows preserve the solutions and independent checkpoints; the extra SELECT question survives header leave/return, collapse and resizing without inheriting a pass. Completion was checked on the pilot final question and a Python stage review, with retained content, wrong-answer relocking, no replay on Back/return, Close reset and compact/short final views. The exact live release and saved screenshots are recorded in project QA. Earlier per-question flow coverage below remains the baseline for unaffected teaching content.

The user requested five questions in each of the eight previously empty Exam categories, with varied GCSE techniques and explicit random list selection. The catalogue now contains 62 Exam questions. Original problem-1 through problem-22, their marks and all guide content are unchanged. Easy/Medium/Hard, their interest categories and school resources are outside this content addition.

Scope checked against [OCR J277 specification v3.1, May 2026](https://www.ocr.org.uk/Images/558027-specification-gcse-computer-science-j277.pdf), sections 2.1.2, 2.1.3, 2.2.1–2.2.3 and 2.3.1–2.3.2. Search/sort tasks apply, trace or complete supplied algorithms; memorised implementations are not required. SQL is limited to SELECT, FROM, WHERE, comparisons and AND/OR. It is taught as SQL in a text console, without Python database boilerplate, joins or aggregation. Every other new solution uses console Python and GCSE constructs.

All guides now cover 433 exact physical code lines across 218 stages, with 209 understanding checks and 90 independent prediction checks. The forty additions account for 266 lines, 107 stages, 121 understanding checks and 48 predictions. Each line has its own explanation and Remember guidance. Correct answers are required at every checkpoint, including before future code/explanations are revealed.

Independent deterministic console/SQLite fixtures cover 116 new cases, including numeric/string boundaries, empty data, failed and successful authentication, random endpoints/retries/draw counts, search absence, sorting duplicates/tails, test categories and SQL result rows. The complete source suite passes 256 Node and 80 Python tests. Per-question expected outputs are in tests/fixtures/exam-expansion-cases.json.

| ID | Tutorial | Main techniques | Stages | Lines | Understanding | Predict after line | Cases | Local Edge full flow |
| --- | --- | --- | ---: | ---: | ---: | --- | ---: | --- |
| problem-23 | Read a seat from a 2D array | 2D indexing, zero-based row/column order | 2 | 4 | 3 | 2 | 2 | Pass |
| problem-24 | Total each team's scores | nested iteration, row aggregation, accumulator reset | 3 | 6 | 3 | 3 | 1 | Pass |
| problem-25 | Find the largest grid reading | 2D traversal, maximum selection, negative-data initialisation | 3 | 7 | 3 | 2 | 3 | Pass |
| problem-26 | Update a stock table | 2D records, field access, in-place update | 2 | 5 | 3 | 3 | 3 | Pass |
| problem-27 | Count occupied seats by column | nested column traversal, conditional counting, rectangular dimensions | 3 | 7 | 3 | 3 | 2 | Pass |
| problem-28 | Apply a percentage discount | real arithmetic, percentage conversion, display precision | 2 | 5 | 3 | 2 | 3 | Pass |
| problem-29 | Convert seconds to minutes and seconds | DIV, MOD, unit conversion, exact boundary | 2 | 4 | 3 | 2 | 4 | Pass |
| problem-30 | Work out the number of paint tins | area formula, named constant, integer ceiling via remainder | 3 | 8 | 3 | 5 | 4 | Pass |
| problem-31 | Calculate a running average | sentinel iteration, sum and count, mean, division-by-zero guard | 3 | 11 | 3 | 7 | 4 | Pass |
| problem-32 | Calculate a tiered journey fare | named constants, if/elif/else, piecewise calculation, inclusive boundaries | 3 | 11 | 3 | 8 | 5 | Pass |
| problem-33 | Create an event code | slicing, case conversion, casting, concatenation | 2 | 4 | 3 | 2 | 3 | Pass |
| problem-34 | Reformat a fixed-format date | fixed-position slicing, field extraction, leading-zero preservation | 2 | 5 | 3 | 4 | 2 | Pass |
| problem-35 | Mask a membership number | suffix slicing, string length, mask construction | 2 | 4 | 3 | 2 | 3 | Pass |
| problem-36 | Build an acronym from words | tokenising words, indexing, string accumulator, case conversion | 3 | 6 | 3 | 4 | 3 | Pass |
| problem-37 | Check a word for symmetry | symmetric indexing, half-length loop, Boolean state, early exit | 3 | 10 | 3 | 2, 5 | 4 | Pass |
| problem-38 | Require a non-empty name | presence validation, whitespace handling, retry loop | 3 | 5 | 3 | 1 | 3 | Pass |
| problem-39 | Check a password length | length validation, OR rejection, inclusive limits | 3 | 5 | 3 | 1 | 3 | Pass |
| problem-40 | Validate a reference format | format validation, safe indexing, allowed characters, persistent failure flag | 3 | 12 | 3 | 4, 8 | 6 | Pass |
| problem-41 | Check both login credentials | authentication, AND, exact text comparison, leading-zero credential | 3 | 6 | 3 | 2 | 4 | Pass |
| problem-42 | Limit login attempts | bounded condition-controlled iteration, NOT and AND, attempt counter, success state | 3 | 11 | 3 | 2, 7 | 3 | Pass |
| problem-43 | Roll two dice | inclusive random bounds, independent draws, saved random values | 2 | 5 | 3 | 2 | 3 | Pass |
| problem-44 | Choose a random list item | random item from a list, dynamic index bounds, zero-based lookup | 3 | 5 | 3 | 3 | 3 | Pass |
| problem-45 | Keep one secret across guesses | random-once placement, condition-controlled guessing, directional comparison | 3 | 10 | 3 | 2, 8 | 3 | Pass |
| problem-46 | Choose two different captains | rejection sampling, distinct random list choices, saved first draw | 3 | 7 | 3 | 4 | 3 | Pass |
| problem-47 | Count sixes in repeated random trials | random-per-iteration placement, fixed-count trials, frequency counter, non-deterministic outcome | 3 | 7 | 3 | 3 | 3 | Pass |
| problem-48 | Trace a linear search | linear search recognition, trace indexes, comparison counting, early exit | 3 | 9 | 3 | 3, 7 | 1 | Pass |
| problem-49 | Complete a binary search | binary search, sorted prerequisite, inclusive bounds, halving, not-found sentinel | 3 | 15 | 4 | 6, 11 | 5 | Pass |
| problem-50 | Apply one bubble-sort pass | bubble-sort pass, adjacent comparison, temporary swap, partial sorting | 3 | 7 | 3 | 3 | 3 | Pass |
| problem-51 | Insert into a sorted section | insertion-sort step, saved key, right shifts, short-circuit boundary | 3 | 8 | 3 | 3 | 3 | Pass |
| problem-52 | Merge two sorted lists | merge phase, two pointers, stable equal-value choice, tail preservation | 3 | 14 | 3 | 6, 12 | 3 | Pass |
| problem-53 | Trace a changing accumulator | trace table, state across iterations, operator precedence, output placement | 3 | 5 | 3 | 3 | 1 | Pass |
| problem-54 | Repair two syntax errors | syntax errors, colon, indentation, threshold verification | 3 | 5 | 3 | 2 | 3 | Pass |
| problem-55 | Fix an off-by-one total | logic error, off-by-one, index coverage, focused regression test | 3 | 5 | 3 | 2 | 3 | Pass |
| problem-56 | Choose normal, boundary and invalid tests | test planning, normal data, valid boundaries, invalid values, erroneous type, early return | 3 | 8 | 3 | 2, 5 | 1 | Pass |
| problem-57 | Repair a loop that never finishes | non-termination, discarded expression, assignment repair, zero/one-iteration testing | 3 | 6 | 3 | 4 | 3 | Pass |
| problem-58 | Select named database fields | SQL SELECT, projection, FROM, all rows | 2 | 2 | 3 | 1 | 2 | Pass |
| problem-59 | Find all available book records | SQL wildcard, numeric equality, row filtering | 2 | 3 | 3 | 2 | 2 | Pass |
| problem-60 | Filter prices at an inclusive limit | SQL numeric comparison, inclusive upper bound, selected fields | 2 | 3 | 3 | 2 | 2 | Pass |
| problem-61 | Require two database conditions | SQL text equality, AND, positive numeric condition, projection independent of filtering | 2 | 3 | 3 | 2 | 2 | Pass |
| problem-62 | Accept either database category | SQL OR, complete alternative comparisons, single-valued field reasoning | 2 | 3 | 3 | 2 | 2 | Pass |

### New exact code and stage mappings

- **problem-23** (python). Mapping `1,2,2,2`. SHA-256 `d8d456189541ca013b4cfc2807f87f8aab2691cff2ed686403aa94be75042e23`.
- **problem-24** (python). Mapping `1,2,2,2,2,3`. SHA-256 `cac843b9c19a39d9e646ae11f5eb8234aa1b74977b9eb6bc28f6ade771b02d5f`.
- **problem-25** (python). Mapping `1,1,2,2,2,2,3`. SHA-256 `4b95cba08cc4cac72a2d4909097b703292452e2b81dacc04ce7c833d3be20346`.
- **problem-26** (python). Mapping `1,1,1,2,2`. SHA-256 `1b857433d0617994db6ffcf14181a978a01a4e9937c91c97a9e61c7853f7cefb`.
- **problem-27** (python). Mapping `1,1,2,2,2,2,3`. SHA-256 `82dbf7f930b0485c25b15361d87d24bbde58dee372a857423aed7f49f83ec04a`.
- **problem-28** (python). Mapping `1,1,2,2,2`. SHA-256 `901d601c137c88264c3f18d0f3ab230dc361229fe5f56bd03062bdc7c615ef84`.
- **problem-29** (python). Mapping `1,2,2,2`. SHA-256 `fa9a8904e691298d106b5b8f891295f1b51e9fbc845f1f9550de0a41d0c68423`.
- **problem-30** (python). Mapping `1,1,1,1,2,2,2,3`. SHA-256 `9147cdc4090ba1480e87c1c6b1a15917b7b48e34490ee4f3c613ec830957be98`.
- **problem-31** (python). Mapping `1,1,1,2,2,2,2,3,3,3,3`. SHA-256 `8902f09eeeffc01ddb783a7bca09864f9b69bc15e60d008c845f97ca59679f27`.
- **problem-32** (python). Mapping `1,1,1,1,2,2,2,2,2,2,3`. SHA-256 `57cf29e8c5a9a5c0dc2d2a739fc97fd03fbbea729f2d0740cbe8e03953dad2c3`.
- **problem-33** (python). Mapping `1,1,2,2`. SHA-256 `fee93e898f5191674c18b8b437d7a5fe98f4a45544df6dc0c34eb2d26426000b`.
- **problem-34** (python). Mapping `1,1,1,1,2`. SHA-256 `659f57d7edd6c3b49d814096414e7be22a8e62b48694ab7f33f0809c56cde953`.
- **problem-35** (python). Mapping `1,1,2,2`. SHA-256 `2f07baecfc8bf544d862c4ced25be05190ad46b5ecd3e0ed2a23128c3c0a3bb1`.
- **problem-36** (python). Mapping `1,1,2,2,2,3`. SHA-256 `9d811fa60119b13deb277d358a0b66227318f19f83311620efcc2008bb4af685`.
- **problem-37** (python). Mapping `1,1,2,2,2,2,3,3,3,3`. SHA-256 `2b92601777fe5ee53749e6a67d7f6b92526dcb93c973c986ccbab06726514221`.
- **problem-38** (python). Mapping `1,2,2,2,3`. SHA-256 `631212d45d5b60c378215260465f585d3f71d1d7948334b4dac11a95fc581d6e`.
- **problem-39** (python). Mapping `1,2,2,2,3`. SHA-256 `5f0db9d95c4a3c507b779c6a9bd275f1249218196916a9c7477a1f024e88ac39`.
- **problem-40** (python). Mapping `1,1,1,1,2,2,2,2,3,3,3,3`. SHA-256 `69e7e3552a91ea1e4c47196973b6e1c9d2d8253b1243652c08bf90b9ca34ec1e`.
- **problem-41** (python). Mapping `1,1,2,3,3,3`. SHA-256 `8c017bdc8a8ea3263489d7d5557c0705fab413135838aa0fe04d13d6575c8ed5`.
- **problem-42** (python). Mapping `1,1,2,2,2,2,2,3,3,3,3`. SHA-256 `73c5d29a8ffae5c12594fe63ae22cf7d2f4245f5f0a5515aa99eec01b8e0db00`.
- **problem-43** (python). Mapping `1,1,1,2,2`. SHA-256 `96c545c8dee5e65c9a724ed99fdf714e786b055ce67569cf8ac989fec5bb6b41`.
- **problem-44** (python). Mapping `1,1,2,2,3`. SHA-256 `4d189bf25824ba87e5d5c41b10a7482904f99dd697ef7b403c2eba67a28831e5`.
- **problem-45** (python). Mapping `1,1,1,2,2,2,2,2,2,3`. SHA-256 `34808c5aaaa1aef64b27956d2470f17aaf723d5af48a7f5975be44f3eab38da2`.
- **problem-46** (python). Mapping `1,1,1,1,2,2,3`. SHA-256 `516fa3b6319812537b5cad6abb5128a66a8a5a9a629a67f3c2d4c51b26d90acc`.
- **problem-47** (python). Mapping `1,1,2,2,2,2,3`. SHA-256 `d36b9422f0659603903fcd9d450626ad4e32eb8a20b5ec3169897604c82b49d7`.
- **problem-48** (python). Mapping `1,1,1,2,2,2,3,3,3`. SHA-256 `16209fa5d5f59a35f6b7e54c7b41af46ff8b0ebd7c7e3b18c37cc2575d7699a4`.
- **problem-49** (python). Mapping `1,1,1,1,1,2,2,2,2,2,2,2,2,2,3`. SHA-256 `d5227d7e7f5ce748e47ca7b0e42a14038bdc9c91c6e7d1ddcb79738e02e85522`.
- **problem-50** (python). Mapping `1,1,2,2,2,2,3`. SHA-256 `b7bf7f79b2f08bbb9764a4d23362e4afd298b2d241f2f2daa232b555a9405a6b`.
- **problem-51** (python). Mapping `1,1,1,2,2,2,3,3`. SHA-256 `42b6e4824dbc484169102aa0e5514aef89a618984b18b852cafd88cf6b9d77d0`.
- **problem-52** (python). Mapping `1,1,1,1,1,2,2,2,2,2,2,2,3,3`. SHA-256 `b7c081242dbbda8a62179353cbad5aa90d99a9066d535701c1420c56df95b291`.
- **problem-53** (python). Mapping `1,1,2,2,3`. SHA-256 `30ec97758f1b7e599e6b31dda7b2705b9922be77cecadaf3714a529f332b8073`.
- **problem-54** (python). Mapping `1,2,3,3,3`. SHA-256 `765bdc0f4b39862d991c912f71330676ae2dfd7ea1b77c8cb422a93cc28b9ae2`.
- **problem-55** (python). Mapping `1,1,2,2,3`. SHA-256 `6544e0023b35474714c3d05e223e4a3d388f6e18476b9602be9f120b9f763b14`.
- **problem-56** (python). Mapping `1,1,1,2,2,3,3,3`. SHA-256 `8db02ebdd82dba667953518a2365078e0665a6eff3182a3ea71098974a09e9c1`.
- **problem-57** (python). Mapping `1,1,2,2,2,3`. SHA-256 `c7a9e49835e7b529e1cdc565e8321862c8895b518a68551a5b93b62fd32ca573`.
- **problem-58** (sql). Mapping `1,2`. SHA-256 `6f1e022e83a72f59bf643378a634504eb375bc56cfde1e0755b9b93e110887eb`.
- **problem-59** (sql). Mapping `1,2,2`. SHA-256 `af6a3681a29101ab810a1b7522a4c074e186bc056418e82b8456cd17dabafdac`.
- **problem-60** (sql). Mapping `1,1,2`. SHA-256 `f0b6781caecafdc1922355abbc25d70ddbc1dca30ec96a3c7035ec3fd848e979`.
- **problem-61** (sql). Mapping `1,1,2`. SHA-256 `4a60fdd619e4fc34718c1fd066df2aa97b638fc2179892b5ab1b034d9821d339`.
- **problem-62** (sql). Mapping `1,1,2`. SHA-256 `17a85433c916808712bcd5dcb285ed53c82206c5510006f582de5abc88cbf833`.

## Original 22-question baseline

22 November 2026 navigation refinement: header chevrons move through problems in the current category in catalogue order, with disabled first/last boundaries. All 22 tutorials retain their own current line, stage, learning view, disclosures, selected answers and fitted content position while switching. A never-visited problem starts with its exam question open. Returning restores the previous view silently, with its checkpoint locks intact; changing viewport maps the same logical line/checkpoint/stage to the fitted layout. Collapsing and reopening Tutorial retains that position. Explicit Close clears all visited-problem positions and answers for a fresh attempt. This is memory for the current open dialog; no pupil tracking or permanent storage is added. The original guide/algorithm coverage below remains unchanged.

Verified 21 November 2026. This is the current coverage register for the 22 existing Exam questions. Level 1/2/3, course resources and concept models are outside this rollout.

All 111 original stages, question requirements, examples and complete solutions are retained. Guides cover 167 physical Python lines, including four blank separators, with 88 current-line understanding questions and 42 selected prediction checkpoints. Every guide has its own line-specific explanation and Remember guidance.

The original string-search guide keeps its approved sequence. The other 21 include original stage reviews, including test-only/extension stages. Temporary pass and diagnostic-print fragments are labelled practice examples; they do not become extra lines in the cumulative program. Explicit line-to-stage mapping preserves the exact finished solution.

Local Edge completed all 22 actual tutorial flows: 404 learning views and all 130 checkpoints, with correct final code, all original stages, wrong-answer/forward-stage locks, question-first defaults and Close-only End. All 104 Node and 33 Python tests pass. The independent algorithm cases below cover normal, absent/duplicate, boundary, empty-file and preservation behavior as appropriate; function reuse adds separate boundary/empty-list checks.

| ID | Tutorial | Original stages | Code lines | Understanding | Predictions after line | Algorithm cases | Local Edge full flow |
| --- | --- | ---: | ---: | ---: | --- | ---: | --- |
| problem-1 | Linear search on a string | 4 | 10 | 5 | 2, 5 | 3 | Pass |
| problem-2 | Linear search on a list | 5 | 5 | 4 | 2, 4 | 2 | Pass |
| problem-3 | For each loop | 3 | 3 | 3 | 1 | 1 | Pass |
| problem-4 | For in range loop | 4 | 4 | 3 | 2 | 1 | Pass |
| problem-5 | Append | 5 | 5 | 4 | 1, 3 | 1 | Pass |
| problem-6 | Empty position | 6 | 6 | 4 | 3, 5 | 1 | Pass |
| problem-7 | Two Conditions | 6 | 6 | 3 | 3, 5 | 1 | Pass |
| problem-8 | Print the index number | 5 | 5 | 4 | 2, 4 | 2 | Pass |
| problem-9 | Count a letter | 5 | 7 | 4 | 3, 6 | 4 | Pass |
| problem-10 | Count even or odd | 6 | 9 | 4 | 3, 8 | 1 | Pass |
| problem-11 | Count threshold | 6 | 10 | 4 | 4, 9 | 1 | Pass |
| problem-12 | Count a range | 6 | 8 | 4 | 4, 7 | 1 | Pass |
| problem-13 | Process String | 5 | 11 | 4 | 2, 5 | 4 | Pass |
| problem-14 | Calculate a ticket price | 5 | 10 | 4 | 5, 8 | 3 | Pass |
| problem-15 | Validate a score | 5 | 8 | 4 | 2, 4 | 3 | Pass |
| problem-16 | Calculate a quiz total | 5 | 9 | 4 | 2, 4 | 1 | Pass |
| problem-17 | Find items to restock | 5 | 10 | 5 | 2, 5 | 1 | Pass |
| problem-18 | Display a text file | 5 | 6 | 5 | 2, 4 | 4 | Pass |
| problem-19 | Append a club member | 5 | 5 | 3 | 1, 3 | 2 | Pass |
| problem-20 | Write a results file | 5 | 9 | 4 | 2, 7 | 1 | Pass |
| problem-21 | Count high readings | 5 | 8 | 4 | 2, 6 | 3 | Pass |
| problem-22 | Copy group bookings | 5 | 13 | 5 | 7, 10 | 4 | Pass |

## Exact line mapping and solution identity

Stage numbers below are one-based; each position in a mapping corresponds to one physical line in the canonical solution. Blank lines remain present. No-code test stages remain available as stage reviews. SHA-256 is over the exact UTF-8 solution string, without adding a final newline.

- **problem-1 — Linear search on a string**. Mapping `1,2,3,3,3,3,4,4,4,4`. SHA-256 `100d43e705d380952f06a96188d3df79ad538e18950010426fb2074657745162`.
- **problem-2 — Linear search on a list**. Mapping `1,2,3,4,5`. SHA-256 `060eb49cbf392b0cea64198cd92d02998a9c5e60bec62f406f628edb4eba857b`.
- **problem-3 — For each loop**. Mapping `1,2,3`. SHA-256 `9b44c8a3b99bbf1cc3682bf1c43fef03f1242f3fbb12cc287563755b841a443d`.
- **problem-4 — For in range loop**. Mapping `1,2,3,4`. SHA-256 `0b2a166060ea3c73a7c8446eda735ba8a095e3f4c17545712e07cc548c8d653f`.
- **problem-5 — Append**. Mapping `1,2,3,4,5`. SHA-256 `a6ff6a77eb5c5e3527512f47acb2025c697e33cba47e8e79688514ad33c6a6f7`.
- **problem-6 — Empty position**. Mapping `1,2,3,4,5,6`. SHA-256 `638b5c1a24fc56cc9ae00ac2dbdbbdcb3faa6217b29c910c06bbc46e888fb2fe`.
- **problem-7 — Two Conditions**. Mapping `1,2,3,4,5,6`. SHA-256 `49bd2644387689186ae6bc05d43036abbbea3030623887537ac7a06299f506a7`.
- **problem-8 — Print the index number**. Mapping `1,2,3,4,5`. SHA-256 `a05560de61396c963e5d984cea36bd558182c0c4721f049fac192f0e6326f614`.
- **problem-9 — Count a letter**. Mapping `1,1,2,3,3,3,4`. SHA-256 `c1f417b5be7706b567de3833f9b969a737df1c53ba5d51053498ef00946b2fc1`.
- **problem-10 — Count even or odd**. Mapping `1,2,3,4,5,5,5,5,6`. SHA-256 `36a95483e9f0becc5d508c05638c8d3645aca0ec0ce7fe1f4cb7ce296e6072a9`.
- **problem-11 — Count threshold**. Mapping `1,2,3,3,4,5,5,5,5,6`. SHA-256 `a654695a2e1241c8a9b227943ae2382a34bc5abfef313d7c7ff9cc2990f85816`.
- **problem-12 — Count a range**. Mapping `1,2,2,3,4,5,5,6`. SHA-256 `172265f4d695e67d0adcba53976eacb9a9a4cc2bf590dc22231fe064ff71e5fb`.
- **problem-13 — Process String**. Mapping `1,1,2,3,3,4,4,4,4,4,5`. SHA-256 `bf101cd61af6066ecac62988e4877e07f1ef8378d9037e024ac99475081cdc1a`.
- **problem-14 — Calculate a ticket price**. Mapping `1,2,2,2,2,3,3,4,5,5`. SHA-256 `90e52269a1ca44f7f101df4cc51495262aee276246e60ae39b57c38070076432`.
- **problem-15 — Validate a score**. Mapping `1,2,2,3,4,4,4,5`. SHA-256 `670fcb80daf77c7c5765f12d47fdcc8365cbfe2cb6ce9583116d603f7c79a333`.
- **problem-16 — Calculate a quiz total**. Mapping `1,2,3,3,4,4,5,5,5`. SHA-256 `c2eac75e6afb81f517e6083b0de2dfa745285089f24d0424f9f181dc5e81b6ba`.
- **problem-17 — Find items to restock**. Mapping `1,2,3,3,3,4,4,5,5,5`. SHA-256 `102e8c4798efd855225305d2198612448041c224750060151d2c8a1f53c04415`.
- **problem-18 — Display a text file**. Mapping `1,2,3,3,3,4`. SHA-256 `4d31599e708a33dfd8acc91896cbdcee30428f9e5e7f0ffb1dcac4e82238b0f5`.
- **problem-19 — Append a club member**. Mapping `1,2,3,4,4`. SHA-256 `1a9a324a99e732af72374f8ea8f9d145553d94db4e1f44c39e47ef385f5e10ed`.
- **problem-20 — Write a results file**. Mapping `1,1,2,3,3,3,3,4,5`. SHA-256 `546905de74a8178cec0eeca3a09da5def07c6c248dda092020ce682da0e7d058`.
- **problem-21 — Count high readings**. Mapping `1,1,2,2,3,3,4,4`. SHA-256 `e9f90e314686bcd332068d1dcba8abb2b7771658d417a6f3d06cdcebbf17a92b`.
- **problem-22 — Copy group bookings**. Mapping `1,1,1,2,2,2,2,3,3,3,4,4,4`. SHA-256 `74bb68898659bd72e6966d76de2becf1184e19d1d8c5eb2ea5b0cf508c05ad9f`.

## Rendered coverage and limits

Desktop Edge at 1400×626 exercised every learning view in all 22 tutorials. Complete compact flows were checked for Find items to restock at 320×740, Count a letter at 320×740 and Copy group bookings at 844×390, including fitted code/explanation/answer/stage-review pages. These three flows cover 95 distinct compact views. Controls and content fit without internal overflow in the checked states. Natural typing completion was awaited before paging earlier code, since typing intentionally keeps the current line visible.

Original generated keyboard clicks and the selected correct/wrong recordings were exercised in a new file-handling tutorial. Escape and an inert sidebar/home click retained its current answer/URL; Back restored a correct choice silently. Automated tests cover all checkpoint IDs and attempt resets. Browser checks use real controls and read-only DOM observations, without application-state injection.

Other browsers, a full screen-reader audit and measured classroom learning outcomes are outside this validation. This file describes source/local coverage; the exact production revision, successful Pages run and live interactions are recorded in the project release QA.

Sources: [catalogue](../data/programming-problems.json), [guides](../data/tutorial-guides.json), [frame/gate tests](../tests/tutorial-rollout.test.cjs), [answer/state tests](../tests/tutorial-tutor.test.cjs), [algorithm cases](../tests/test_programming_algorithms.py).
