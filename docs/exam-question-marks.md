# Exam question marks

## Requested SQL refinements and extra practice — 22 November 2026

The five existing SQL allocations remain 3, 3, 4, 5 and 5 marks. Instructions and credit-point descriptions are reworded into concrete checks without changing the five complete solutions. All seven SQL tables now have four fields and six sample records. The two extra questions were explicitly requested by the teacher and are original CSRevision SQL extensions, not official OCR questions or required J277 keywords. Each has four meaningful credit points.

| ID | Question | Marks | Credit points |
| --- | --- | ---: | --- |
| problem-63 | Sort prices from lowest to highest (ASC) | 4 | SELECT Name/Price; FROM Products; ORDER BY Price; ASC |
| problem-64 | Find names starting with A (LIKE) | 4 | SELECT Name; FROM Students; WHERE with LIKE; starts-with pattern A% |

## Current forty-question addition — 22 November 2026

The user requested five questions in each of the eight previously empty Exam categories, with varied GCSE techniques and explicit random list selection. The catalogue now contains 62 Exam questions. Original problem-1 through problem-22, their marks and all guide content are unchanged. Easy/Medium/Hard, their interest categories and school resources are outside this content addition.

The new questions are original CSRevision practice in OCR GCSE style, not official OCR questions or official tariffs. Each has 3–6 marks with that exact number of task-specific credit points in question.marking.points. The points cover meaningful outcomes rather than counting source-code lines. The total appears after all requirements, including on the final fitted question page. All original allocations below remain unchanged.

| ID | Question | Marks | Basis |
| --- | --- | ---: | --- |
| problem-23 | Read a seat from a 2D array | 4 | Original CSRevision practice |
| problem-24 | Total each team's scores | 5 | Original CSRevision practice |
| problem-25 | Find the largest grid reading | 5 | Original CSRevision practice |
| problem-26 | Update a stock table | 5 | Original CSRevision practice |
| problem-27 | Count occupied seats by column | 5 | Original CSRevision practice |
| problem-28 | Apply a percentage discount | 4 | Original CSRevision practice |
| problem-29 | Convert seconds to minutes and seconds | 4 | Original CSRevision practice |
| problem-30 | Work out the number of paint tins | 5 | Original CSRevision practice |
| problem-31 | Calculate a running average | 6 | Original CSRevision practice |
| problem-32 | Calculate a tiered journey fare | 6 | Original CSRevision practice |
| problem-33 | Create an event code | 4 | Original CSRevision practice |
| problem-34 | Reformat a fixed-format date | 4 | Original CSRevision practice |
| problem-35 | Mask a membership number | 4 | Original CSRevision practice |
| problem-36 | Build an acronym from words | 5 | Original CSRevision practice |
| problem-37 | Check a word for symmetry | 5 | Original CSRevision practice |
| problem-38 | Require a non-empty name | 4 | Original CSRevision practice |
| problem-39 | Check a password length | 4 | Original CSRevision practice |
| problem-40 | Validate a reference format | 6 | Original CSRevision practice |
| problem-41 | Check both login credentials | 5 | Original CSRevision practice |
| problem-42 | Limit login attempts | 6 | Original CSRevision practice |
| problem-43 | Roll two dice | 5 | Original CSRevision practice |
| problem-44 | Choose a random list item | 4 | Original CSRevision practice |
| problem-45 | Keep one secret across guesses | 6 | Original CSRevision practice |
| problem-46 | Choose two different captains | 5 | Original CSRevision practice |
| problem-47 | Count sixes in repeated random trials | 5 | Original CSRevision practice |
| problem-48 | Trace a linear search | 4 | Original CSRevision practice |
| problem-49 | Complete a binary search | 5 | Original CSRevision practice |
| problem-50 | Apply one bubble-sort pass | 4 | Original CSRevision practice |
| problem-51 | Insert into a sorted section | 4 | Original CSRevision practice |
| problem-52 | Merge two sorted lists | 5 | Original CSRevision practice |
| problem-53 | Trace a changing accumulator | 4 | Original CSRevision practice |
| problem-54 | Repair two syntax errors | 4 | Original CSRevision practice |
| problem-55 | Fix an off-by-one total | 4 | Original CSRevision practice |
| problem-56 | Choose normal, boundary and invalid tests | 6 | Original CSRevision practice |
| problem-57 | Repair a loop that never finishes | 5 | Original CSRevision practice |
| problem-58 | Display student names and year groups | 3 | Original CSRevision practice |
| problem-59 | Find books that can be borrowed | 3 | Original CSRevision practice |
| problem-60 | Find products costing 10 or less | 4 | Original CSRevision practice |
| problem-61 | Find Tuesday clubs with places (AND) | 5 | Original CSRevision practice |
| problem-62 | Find Puzzle or Strategy games (OR) | 5 | Original CSRevision practice |

Scope checked against [OCR J277 specification v3.1, May 2026](https://www.ocr.org.uk/Images/558027-specification-gcse-computer-science-j277.pdf), sections 2.1.2, 2.1.3, 2.2.1–2.2.3 and 2.3.1–2.3.2. Search/sort tasks apply, trace or complete supplied algorithms; memorised implementations are not required. SQL is limited to SELECT, FROM, WHERE, comparisons and AND/OR. It is taught as SQL in a text console, without Python database boilerplate, joins or aggregation. Every other new solution uses console Python and GCSE constructs.

## Original 22 allocations and source review

Reviewed 22 November 2026. All 22 questions are console programming practice. Their existing wording, examples, tutorial stages, complete solutions and guided checkpoints are retained.

Display one total after the final question requirement and before Tutorial, for example **(6 marks)**. The total belongs to the question text, including its final fitted page on a compact screen. Do not put it in the disclosure heading or catalogue row.

## Allocation method and provenance

The user authorised CSRevision to resolve missing or conflicting tariffs using OCR GCSE Computer Science **J277** practice, with six as the maximum for the harder questions in this catalogue. This is a catalogue rule, not a claim that every OCR question is capped at six.

OCR's [June 2024 J277/02 mark scheme, question 8(b), page 18](https://www.ocr.org.uk/Images/727653-mark-scheme-computational-thinking-algorithms-and-programming.pdf) uses separate credit for parameter use, selection, boundary handling and a returned result. The [June 2023 scheme, questions 6(e) and 6(f)(ii), pages 28–29](https://www.ocr.org.uk/Images/704883-mark-scheme-computational-thinking-algorithms-and-programming.pdf) illustrates point allocations for file operations and conditional accumulation. These are style references; no CSRevision allocation is represented as an official OCR past-paper mark scheme.

Twelve unambiguous totals are retained from the user's Coding eBook: problems 2–13. Each has its exact source tab identity/title and a one-mark-per-point rationale in `data/programming-problems.json`. The eBook is a teaching source, not an OCR paper. Its private editor link remains outside the pupil page.

The string-search source tab is inconsistent: its title says [4], while its six-mark question and scheme describe a different seating-list task. Neither was silently treated as the string-search allocation. Under the user's instruction to work it out, problem-1 receives six CSRevision points for its actual input, flag, indexed traversal, character comparison/update, early termination and conditional outcome. The source document is unchanged.

The nine questions added later have no matching question/marks in those source tutorial tabs. They receive CSRevision allocations supported by explicit assessed features: four for straightforward append, five for ticket pricing and sequential file display, and six for the combined validation, accumulation, filtering and structured file tasks. Criteria are in the same canonical question objects; do not infer marks from code length, stage count or number of numbered requirements.

Equivalent correct console solutions may satisfy the same criteria unless the question specifically requires a technique. Do not require exact variable names or the example solution's incidental formatting. Preserve the named function/file constraints and required boundaries. No GUI is required or introduced. These totals do not implement automated assessment or pupil tracking.

## Current coverage

| ID | Question | Marks | Allocation basis |
| --- | --- | ---: | --- |
| problem-1 | Linear search on a string | 6 | CSRevision practice |
| problem-2 | Linear search on a list | 4 | Coding eBook |
| problem-3 | For each loop | 4 | Coding eBook |
| problem-4 | For in range loop | 4 | Coding eBook |
| problem-5 | Append | 4 | Coding eBook |
| problem-6 | Empty position | 4 | Coding eBook |
| problem-7 | Two Conditions | 6 | Coding eBook |
| problem-8 | Print the index number | 6 | Coding eBook |
| problem-9 | Count a letter | 6 | Coding eBook |
| problem-10 | Count even or odd | 6 | Coding eBook |
| problem-11 | Count threshold | 6 | Coding eBook |
| problem-12 | Count a range | 6 | Coding eBook |
| problem-13 | Process String | 6 | Coding eBook |
| problem-14 | Calculate a ticket price | 5 | CSRevision practice |
| problem-15 | Validate a score | 6 | CSRevision practice |
| problem-16 | Calculate a quiz total | 6 | CSRevision practice |
| problem-17 | Find items to restock | 6 | CSRevision practice |
| problem-18 | Display a text file | 5 | CSRevision practice |
| problem-19 | Append a club member | 4 | CSRevision practice |
| problem-20 | Write a results file | 6 | CSRevision practice |
| problem-21 | Count high readings | 6 | CSRevision practice |
| problem-22 | Copy group bookings | 6 | CSRevision practice |

All 22 allocations have exactly the stated number of non-empty credit points. Build validation rejects missing, non-integer, unsupported or unjustified totals. The existing exam-technique categories and all 22 complete tutorial guides remain intact.

## Practice navigation

The stable collection IDs `level1`, `level2` and `level3` now display Easy, Medium and Hard. Each shares the nine interest tabs Science, Maths, Finance, Computing, Gaming, Creative & Media, Social & Community, Health & Fitness, and Environment & Sustainability. Keep the selected interest when changing difficulty and retain the separate Exam technique selection when returning. Compact visible labels can shorten Creative, Social, Fitness and Environment while keeping the full accessible name and selected heading.

The user approved these categories as choices for all learners. Do not label any category as belonging to a gender. This request prepares navigation only; the practice collections honestly remain empty until their problems are authored. All subsequent problems must be solvable using console text input/output, with text files where relevant; no GUI dependency.
