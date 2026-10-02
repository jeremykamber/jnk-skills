# Starter Gherkin. Copy to features/<behavior>.feature.
#
# Rules that make this file useful rather than decorative:
#
#   1. Parameterize anything that could vary. The acceptance mutator works on
#      the example values in the parsed tables, so a hard-coded value is an
#      untested assumption.
#   2. One scenario per observable outcome. A scenario with three Thens is
#      usually three scenarios.
#   3. Write it before the code, from the outside. Scenarios written after the
#      implementation are a duplicate of the unit tests with no prevention value.
#   4. Move repeated setup into Background, but only when it preserves meaning.

Feature: <the behavior, named the way a user would name it>

  Background:
    Given <the state every scenario in this file starts from>

  Scenario: <the happy path, named by its outcome>
    Given <a starting condition>
    When <the user does the thing>
    Then <the observable result>

  Scenario Outline: <a rule with varying values>
    Given a <kind> account
    When the user requests <amount>
    Then the request is <outcome>

    Examples:
      | kind     | amount | outcome   |
      | standard | 100    | accepted  |
      | standard | 0      | rejected  |
      | trial    | 100    | rejected  |

  Scenario: <the boundary that is easy to get wrong>
    Given <a condition at the edge>
    When <the user does the thing>
    Then <the observable result that proves the edge is handled>
