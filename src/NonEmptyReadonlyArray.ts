/**
 * Data structure which represents non-empty readonly arrays.
 *
 * ```ts
 * export type NonEmptyReadonlyArray<A> = ReadonlyArray<A> & {
 *   readonly 0: A
 * }
 * ```
 *
 * Note that you don't need any conversion, a `NonEmptyReadonlyArray` is a `ReadonlyArray`,
 * so all `ReadonlyArray`'s APIs can be used with a `NonEmptyReadonlyArray` without further ado.
 *
 * @since 1.0.0
 */
import type * as comonad from "@fp-ts/core/Comonad"
import * as flattenable from "@fp-ts/core/FlatMap"
import * as functor from "@fp-ts/core/Functor"
import type { Kind, TypeLambda } from "@fp-ts/core/HKT"
import type * as monad from "@fp-ts/core/Monad"
import type * as monoidal from "@fp-ts/core/Monoidal"
import * as semigroup from "@fp-ts/core/Semigroup"
import type { Semigroup } from "@fp-ts/core/Semigroup"
import * as semigroupal from "@fp-ts/core/Semigroupal"
import * as ord from "@fp-ts/core/Sortable"
import type { Sortable } from "@fp-ts/core/Sortable"
import type * as traversable from "@fp-ts/core/Traversable"
import type { Endomorphism } from "@fp-ts/data/Endomorphism"
import { equals } from "@fp-ts/data/Equal"
import { flow, identity, pipe } from "@fp-ts/data/Function"
import * as internal from "@fp-ts/data/internal/Common"
import type { Option } from "@fp-ts/data/Option"

/**
 * @category models
 * @since 1.0.0
 */
export type NonEmptyReadonlyArray<A> = readonly [A, ...Array<A>]

// -------------------------------------------------------------------------------------
// internal
// -------------------------------------------------------------------------------------

/**
 * @internal
 */
export const prepend = <B>(head: B) =>
  <A>(tail: ReadonlyArray<A>): NonEmptyReadonlyArray<A | B> => [head, ...tail]

/**
 * @internal
 */
export const append = <B>(end: B) =>
  <A>(init: ReadonlyArray<A>): NonEmptyReadonlyArray<A | B> => concat([end])(init)

/**
 * Builds a `NonEmptyReadonlyArray` from an array returning `none` if `as` is an empty array.
 *
 * @category constructors
 * @since 1.0.0
 */
export const fromReadonlyArray = <A>(as: ReadonlyArray<A>): Option<NonEmptyReadonlyArray<A>> =>
  internal.isNonEmpty(as) ? internal.some(as) : internal.none

/**
 * Return a `NonEmptyReadonlyArray` of length `n` with element `i` initialized with `f(i)`.
 *
 * **Note**. `n` is normalized to a natural number.
 *
 * @exampleTodo
 * import { makeBy } from '@fp-ts/core/data/NonEmptyReadonlyArray'
 * import { pipe } from '@fp-ts/core/data/Function'
 *
 * const double = (n: number): number => n * 2
 * assert.deepStrictEqual(pipe(5, makeBy(double)), [0, 2, 4, 6, 8])
 *
 * @category constructors
 * @since 1.0.0
 */
export const makeBy = <A>(f: (i: number) => A) =>
  (n: number): NonEmptyReadonlyArray<A> => {
    const j = Math.max(0, Math.floor(n))
    const out: internal.NonEmptyArray<A> = [f(0)]
    for (let i = 1; i < j; i++) {
      out.push(f(i))
    }
    return out
  }

/**
 * Create a `NonEmptyReadonlyArray` containing a value repeated the specified number of times.
 *
 * **Note**. `n` is normalized to a natural number.
 *
 * @exampleTodo
 * import { replicate } from '@fp-ts/core/data/NonEmptyReadonlyArray'
 * import { pipe } from '@fp-ts/core/data/Function'
 *
 * assert.deepStrictEqual(pipe(3, replicate('a')), ['a', 'a', 'a'])
 *
 * @category constructors
 * @since 1.0.0
 */
export const replicate = <A>(a: A): ((n: number) => NonEmptyReadonlyArray<A>) => makeBy(() => a)

/**
 * Create a `NonEmptyReadonlyArray` containing a range of integers, including both endpoints.
 *
 * @exampleTodo
 * import { range } from '@fp-ts/core/data/NonEmptyReadonlyArray'
 *
 * assert.deepStrictEqual(range(1, 5), [1, 2, 3, 4, 5])
 *
 * @category constructors
 * @since 1.0.0
 */
export const range = (start: number, end: number): NonEmptyReadonlyArray<number> =>
  start <= end ? makeBy((i) => start + i)(end - start + 1) : [start]

// -------------------------------------------------------------------------------------
// pattern matching
// -------------------------------------------------------------------------------------

/**
 * Produces a couple of the first element of the array, and a new array of the remaining elements, if any.
 *
 * @exampleTodo
 * import { unprepend } from '@fp-ts/core/data/NonEmptyReadonlyArray'
 *
 * assert.deepStrictEqual(unprepend([1, 2, 3, 4]), [1, [2, 3, 4]])
 *
 * @category pattern matching
 * @since 1.0.0
 */
export const unprepend = <A>(
  as: NonEmptyReadonlyArray<A>
): readonly [A, ReadonlyArray<A>] => [head(as), tail(as)]

/**
 * Produces a couple of a copy of the array without its last element, and that last element.
 *
 * @exampleTodo
 * import { unappend } from '@fp-ts/core/data/NonEmptyReadonlyArray'
 *
 * assert.deepStrictEqual(unappend([1, 2, 3, 4]), [[1, 2, 3], 4])
 *
 * @category pattern matching
 * @since 1.0.0
 */
export const unappend = <A>(
  as: NonEmptyReadonlyArray<A>
): readonly [ReadonlyArray<A>, A] => [init(as), last(as)]

/**
 * Break a `ReadonlyArray` into its first element and remaining elements.
 *
 * @category pattern matching
 * @since 1.0.0
 */
export const matchLeft = <A, B>(f: (head: A, tail: ReadonlyArray<A>) => B) =>
  (as: NonEmptyReadonlyArray<A>): B => f(head(as), tail(as))

/**
 * Break a `ReadonlyArray` into its initial elements and the last element.
 *
 * @category pattern matching
 * @since 1.0.0
 */
export const matchRight = <A, B>(f: (init: ReadonlyArray<A>, last: A) => B) =>
  (as: NonEmptyReadonlyArray<A>): B => f(init(as), last(as))

/**
 * @since 1.0.0
 */
export function concat<B>(
  that: NonEmptyReadonlyArray<B>
): <A>(self: ReadonlyArray<A>) => NonEmptyReadonlyArray<A | B>
export function concat<B>(
  that: ReadonlyArray<B>
): <A>(self: NonEmptyReadonlyArray<A>) => NonEmptyReadonlyArray<A | B>
export function concat<B>(
  that: ReadonlyArray<B>
): <A>(self: NonEmptyReadonlyArray<A>) => ReadonlyArray<A | B> {
  return <A>(self: NonEmptyReadonlyArray<A | B>) => self.concat(that)
}

/**
 * Remove duplicates from a `NonEmptyReadonlyArray`, keeping the first occurrence of an element.
 *
 * @exampleTodo
 * import { uniq } from '@fp-ts/core/data/NonEmptyReadonlyArray'
 * import * as N from '@fp-ts/core/data/number'
 *
 * assert.deepStrictEqual(uniq(N.Eq)([1, 2, 1]), [1, 2])
 *
 * @since 1.0.0
 */
export const uniq = <A>(self: NonEmptyReadonlyArray<A>): NonEmptyReadonlyArray<A> => {
  if (self.length === 1) {
    return self
  }
  const out: internal.NonEmptyArray<A> = [head(self)]
  const rest = tail(self)
  for (const a of rest) {
    if (out.every((o) => !equals(o)(a))) {
      out.push(a)
    }
  }
  return out
}

/**
 * Sort the elements of a `NonEmptyReadonlyArray` in increasing order, where elements are compared using first `ords[0]`, then `ords[1]`,
 * etc...
 *
 * @exampleTodo
 * import * as RNEA from '@fp-ts/core/data/NonEmptyReadonlyArray'
 * import { contramap } from '@fp-ts/core/typeclasses/Ord'
 * import * as S from '@fp-ts/core/data/string'
 * import * as N from '@fp-ts/core/data/number'
 * import { pipe } from '@fp-ts/core/data/Function'
 *
 * interface Person {
 *   name: string
 *   age: number
 * }
 *
 * const byName = pipe(S.Ord, contramap((p: Person) => p.name))
 *
 * const byAge = pipe(N.Ord, contramap((p: Person) => p.age))
 *
 * const sortByNameByAge = RNEA.sortBy([byName, byAge])
 *
 * const persons: RNEA.NonEmptyReadonlyArray<Person> = [
 *   { name: 'a', age: 1 },
 *   { name: 'b', age: 3 },
 *   { name: 'c', age: 2 },
 *   { name: 'b', age: 2 }
 * ]
 *
 * assert.deepStrictEqual(sortByNameByAge(persons), [
 *   { name: 'a', age: 1 },
 *   { name: 'b', age: 2 },
 *   { name: 'b', age: 3 },
 *   { name: 'c', age: 2 }
 * ])
 *
 * @since 1.0.0
 */
export const sortBy = <B>(
  ords: ReadonlyArray<Sortable<B>>
): (<A extends B>(as: NonEmptyReadonlyArray<A>) => NonEmptyReadonlyArray<A>) => {
  if (internal.isNonEmpty(ords)) {
    return sort(ord.getMonoid<B>().combineAll(ords))
  }
  return identity
}

/**
 * Creates a `ReadonlyArray` of unique values, in order, from all given `ReadonlyArray`s using a `Eq` for equality comparisons.
 *
 * @exampleTodo
 * import { union } from '@fp-ts/core/data/ReadonlyArray'
 * import * as N from '@fp-ts/core/data/number'
 * import { pipe } from '@fp-ts/core/data/Function'
 *
 * assert.deepStrictEqual(pipe([1, 2], union(N.Eq)([2, 3])), [1, 2, 3])
 *
 * @since 1.0.0
 */
export const union = <B>(that: ReadonlyArray<B>) =>
  <A>(self: NonEmptyReadonlyArray<A>) => uniq(concat(that)(self))

/**
 * Rotate a `NonEmptyReadonlyArray` by `n` steps.
 *
 * @exampleTodo
 * import { rotate } from '@fp-ts/core/data/NonEmptyReadonlyArray'
 *
 * assert.deepStrictEqual(rotate(2)([1, 2, 3, 4, 5]), [4, 5, 1, 2, 3])
 * assert.deepStrictEqual(rotate(-2)([1, 2, 3, 4, 5]), [3, 4, 5, 1, 2])
 *
 * @since 1.0.0
 */
export const rotate = (n: number) =>
  <A>(as: NonEmptyReadonlyArray<A>): NonEmptyReadonlyArray<A> => {
    const len = as.length
    const m = Math.round(n) % len
    if (isOutOfBound(Math.abs(m), as) || m === 0) {
      return as
    }
    if (m < 0) {
      const [f, s] = splitAt(-m)(as)
      return concat(f)(s)
    } else {
      return rotate(m - len)(as)
    }
  }

/**
 * Apply a function to the head, creating a new `NonEmptyReadonlyArray`.
 *
 * @since 1.0.0
 */
export const modifyHead = <A>(f: Endomorphism<A>) =>
  (as: NonEmptyReadonlyArray<A>): NonEmptyReadonlyArray<A> => [f(head(as)), ...tail(as)]

/**
 * Change the head, creating a new `NonEmptyReadonlyArray`.
 *
 * @since 1.0.0
 */
export const updateHead = <A>(a: A): ((as: NonEmptyReadonlyArray<A>) => NonEmptyReadonlyArray<A>) =>
  modifyHead(() => a)

/**
 * Apply a function to the last element, creating a new `NonEmptyReadonlyArray`.
 *
 * @since 1.0.0
 */
export const modifyLast = <A>(f: Endomorphism<A>) =>
  (as: NonEmptyReadonlyArray<A>): NonEmptyReadonlyArray<A> => pipe(init(as), append(f(last(as))))

/**
 * Change the last element, creating a new `NonEmptyReadonlyArray`.
 *
 * @since 1.0.0
 */
export const updateLast = <A>(a: A): ((as: NonEmptyReadonlyArray<A>) => NonEmptyReadonlyArray<A>) =>
  modifyLast(() => a)

/**
 * Places an element in between members of a `NonEmptyReadonlyArray`, then folds the results using the provided `Semigroup`.
 *
 * @exampleTodo
 * import * as S from '@fp-ts/core/data/string'
 * import { intercalate } from '@fp-ts/core/data/NonEmptyReadonlyArray'
 *
 * assert.deepStrictEqual(intercalate(S.Semigroup)('-')(['a', 'b', 'c']), 'a-b-c')
 *
 * @since 1.0.0
 */
export const intercalate = <A>(
  S: Semigroup<A>
): ((middle: A) => (as: NonEmptyReadonlyArray<A>) => A) => {
  const combineAllS = combineAll(S)
  return (middle) => flow(intersperse(middle), combineAllS)
}

/**
 * @since 1.0.0
 */
export const reverse = <A>(as: NonEmptyReadonlyArray<A>): NonEmptyReadonlyArray<A> =>
  as.length === 1 ? as : [last(as), ...as.slice(0, -1).reverse()]

/**
 * Group equal, consecutive elements of an array into non empty arrays.
 *
 * @exampleTodo
 * import { group } from '@fp-ts/core/data/NonEmptyReadonlyArray'
 * import * as N from '@fp-ts/core/data/number'
 *
 * assert.deepStrictEqual(group(N.Eq)([1, 2, 1, 1]), [
 *   [1],
 *   [2],
 *   [1, 1]
 * ])
 *
 * @since 1.0.0
 */
export const group = <A>(
  as: NonEmptyReadonlyArray<A>
): NonEmptyReadonlyArray<NonEmptyReadonlyArray<A>> =>
  pipe(
    as,
    chop((as) => {
      const h = head(as)
      const out: internal.NonEmptyArray<A> = [h]
      let i = 1
      for (; i < as.length; i++) {
        const a = as[i]
        if (equals(a, h)) {
          out.push(a)
        } else {
          break
        }
      }
      return [out, as.slice(i)]
    })
  )

/**
 * Splits an array into sub-non-empty-arrays stored in an object, based on the result of calling a `string`-returning
 * function on each element, and grouping the results according to values returned
 *
 * @exampleTodo
 * import { groupBy } from '@fp-ts/core/data/NonEmptyReadonlyArray'
 *
 * assert.deepStrictEqual(groupBy((s: string) => String(s.length))(['foo', 'bar', 'foobar']), {
 *   '3': ['foo', 'bar'],
 *   '6': ['foobar']
 * })
 *
 * @since 1.0.0
 */
export const groupBy = <A>(f: (a: A) => string) =>
  (as: ReadonlyArray<A>): Readonly<Record<string, NonEmptyReadonlyArray<A>>> => {
    const out: Record<string, internal.NonEmptyArray<A>> = {}
    for (const a of as) {
      const k = f(a)
      if (internal.has.call(out, k)) {
        out[k].push(a)
      } else {
        out[k] = [a]
      }
    }
    return out
  }

/**
 * Sort the elements of a `NonEmptyReadonlyArray` in increasing order, creating a new `NonEmptyReadonlyArray`.
 *
 * @since 1.0.0
 */
export const sort = <B>(O: Sortable<B>) =>
  <A extends B>(as: NonEmptyReadonlyArray<A>): NonEmptyReadonlyArray<A> =>
    as.length === 1 ? as : (as.slice().sort((self, that) => O.compare(that)(self)) as any)

/**
 * @internal
 */
export const isOutOfBound = <A>(i: number, as: ReadonlyArray<A>): boolean => i < 0 || i >= as.length

/**
 * Change the element at the specified index, creating a new `NonEmptyReadonlyArray`, or returning `None` if the index is out of bounds.
 *
 * @since 1.0.0
 */
export const updateAt = <A>(
  i: number,
  a: A
): ((as: NonEmptyReadonlyArray<A>) => Option<NonEmptyReadonlyArray<A>>) => modifyAt(i, () => a)

/**
 * Apply a function to the element at the specified index, creating a new `NonEmptyReadonlyArray`, or returning `None` if the index is out
 * of bounds.
 *
 * @since 1.0.0
 */
export const modifyAt = <A>(i: number, f: (a: A) => A) =>
  (self: NonEmptyReadonlyArray<A>): Option<NonEmptyReadonlyArray<A>> => {
    if (isOutOfBound(i, self)) {
      return internal.none
    }
    const prev = self[i]
    const next = f(prev)
    if (next === prev) {
      return internal.some(self)
    }
    const out = internal.fromNonEmptyReadonlyArray(self)
    out[i] = next
    return internal.some(out)
  }

/**
 * @since 1.0.0
 */
export const zipWith = <B, A, C>(bs: NonEmptyReadonlyArray<B>, f: (a: A, b: B) => C) =>
  (as: NonEmptyReadonlyArray<A>): NonEmptyReadonlyArray<C> => {
    const cs: internal.NonEmptyArray<C> = [f(head(as), head(bs))]
    const len = Math.min(as.length, bs.length)
    for (let i = 1; i < len; i++) {
      cs[i] = f(as[i], bs[i])
    }
    return cs
  }

/**
 * @since 1.0.0
 */
export const zip = <B>(bs: NonEmptyReadonlyArray<B>) =>
  <A>(as: NonEmptyReadonlyArray<A>): NonEmptyReadonlyArray<readonly [A, B]> =>
    pipe(
      as,
      zipWith(bs, (a, b) => [a, b])
    )

/**
 * @since 1.0.0
 */
export const unzip = <A, B>(
  abs: NonEmptyReadonlyArray<readonly [A, B]>
): readonly [NonEmptyReadonlyArray<A>, NonEmptyReadonlyArray<B>] => {
  const fa: internal.NonEmptyArray<A> = [abs[0][0]]
  const fb: internal.NonEmptyArray<B> = [abs[0][1]]
  for (let i = 1; i < abs.length; i++) {
    fa[i] = abs[i][0]
    fb[i] = abs[i][1]
  }
  return [fa, fb]
}

/**
 * Prepend an element to every member of an array
 *
 * @exampleTodo
 * import { prependAll } from '@fp-ts/core/data/NonEmptyReadonlyArray'
 * import { pipe } from '@fp-ts/core/data/Function'
 *
 * assert.deepStrictEqual(pipe([1, 2, 3, 4], prependAll(9)), [9, 1, 9, 2, 9, 3, 9, 4])
 *
 * @since 1.0.0
 */
export const prependAll = <A>(middle: A) =>
  (as: NonEmptyReadonlyArray<A>): NonEmptyReadonlyArray<A> => {
    const out: internal.NonEmptyArray<A> = [middle, head(as)]
    for (let i = 1; i < as.length; i++) {
      out.push(middle, as[i])
    }
    return out
  }

/**
 * Places an element in between members of an array
 *
 * @exampleTodo
 * import { intersperse } from '@fp-ts/core/data/NonEmptyReadonlyArray'
 * import { pipe } from '@fp-ts/core/data/Function'
 *
 * assert.deepStrictEqual(pipe([1, 2, 3, 4], intersperse(9)), [1, 9, 2, 9, 3, 9, 4])
 *
 * @since 1.0.0
 */
export const intersperse = <A>(middle: A) =>
  (as: NonEmptyReadonlyArray<A>): NonEmptyReadonlyArray<A> => {
    const rest = tail(as)
    return internal.isNonEmpty(rest) ? prepend(head(as))(prependAll(middle)(rest)) : as
  }

/**
 * @since 1.0.0
 */
export const flatMapWithIndex = <A, B>(f: (i: number, a: A) => NonEmptyReadonlyArray<B>) =>
  (self: NonEmptyReadonlyArray<A>): NonEmptyReadonlyArray<B> => {
    const out: internal.NonEmptyArray<B> = internal.fromNonEmptyReadonlyArray(f(0, head(self)))
    for (let i = 1; i < self.length; i++) {
      out.push(...f(i, self[i]))
    }
    return out
  }

/**
 * A useful recursion pattern for processing a `NonEmptyReadonlyArray` to produce a new `NonEmptyReadonlyArray`, often used for "chopping" up the input
 * `NonEmptyReadonlyArray`. Typically `chop` is called with some function that will consume an initial prefix of the `NonEmptyReadonlyArray` and produce a
 * value and the tail of the `NonEmptyReadonlyArray`.
 *
 * @since 1.0.0
 */
export const chop = <A, B>(f: (as: NonEmptyReadonlyArray<A>) => readonly [B, ReadonlyArray<A>]) =>
  (as: NonEmptyReadonlyArray<A>): NonEmptyReadonlyArray<B> => {
    const [b, rest] = f(as)
    const out: internal.NonEmptyArray<B> = [b]
    let next: ReadonlyArray<A> = rest
    while (internal.isNonEmpty(next)) {
      const [b, rest] = f(next)
      out.push(b)
      next = rest
    }
    return out
  }

/**
 * Splits a `NonEmptyReadonlyArray` into two pieces, the first piece has max `n` elements.
 *
 * @since 1.0.0
 */
export const splitAt = (n: number) =>
  <A>(as: NonEmptyReadonlyArray<A>): readonly [NonEmptyReadonlyArray<A>, ReadonlyArray<A>] => {
    const m = Math.max(1, n)
    return m >= as.length ?
      [as, internal.empty] :
      [pipe(as.slice(1, m), prepend(head(as))), as.slice(m)]
  }

/**
 * Splits a `NonEmptyReadonlyArray` into length-`n` pieces. The last piece will be shorter if `n` does not evenly divide the length of
 * the `NonEmptyReadonlyArray`.
 *
 * @since 1.0.0
 */
export const chunksOf = (
  n: number
): (<A>(as: NonEmptyReadonlyArray<A>) => NonEmptyReadonlyArray<NonEmptyReadonlyArray<A>>) =>
  chop(splitAt(n))

/**
 * Identifies an associative operation on a type constructor. It is similar to `Semigroup`, except that it applies to
 * types of kind `* -> *`.
 *
 * In case of `NonEmptyReadonlyArray` concatenates the inputs into a single array.
 *
 * @exampleTodo
 * import * as RNEA from '@fp-ts/core/data/NonEmptyReadonlyArray'
 * import { pipe } from '@fp-ts/core/data/Function'
 *
 * assert.deepStrictEqual(
 *   pipe(
 *     [1, 2, 3] as const,
 *     RNEA.orElse([4, 5])
 *   ),
 *   [1, 2, 3, 4, 5]
 * )
 *
 * @since 1.0.0
 */
export const orElse = <B>(
  that: NonEmptyReadonlyArray<B>
): (<A>(self: NonEmptyReadonlyArray<A>) => NonEmptyReadonlyArray<A | B>) => concat(that)

/**
 * Returns an effect whose success is mapped by the specified `f` function.
 *
 * @category mapping
 * @since 1.0.0
 */
export const map: <A, B>(
  f: (a: A) => B
) => (fa: NonEmptyReadonlyArray<A>) => NonEmptyReadonlyArray<B> = (f) =>
  mapWithIndex((_, a) => f(a))

/**
 * @category constructors
 * @since 1.0.0
 */
export const of: <A>(a: A) => NonEmptyReadonlyArray<A> = internal.toNonEmptyArray

/**
 * @exampleTodo
 * import * as RNEA from '@fp-ts/core/data/NonEmptyReadonlyArray'
 * import { pipe } from '@fp-ts/core/data/Function'
 *
 * assert.deepStrictEqual(
 *   pipe(
 *     [1, 2, 3],
 *     RNEA.flatMap((n) => [`a${n}`, `b${n}`])
 *   ),
 *   ['a1', 'b1', 'a2', 'b2', 'a3', 'b3']
 * )
 *
 * @category sequencing
 * @since 1.0.0
 */
export const flatMap: <A, B>(
  f: (a: A) => NonEmptyReadonlyArray<B>
) => (self: NonEmptyReadonlyArray<A>) => NonEmptyReadonlyArray<B> = (f) =>
  flatMapWithIndex((_, a) => f(a))

/**
 * @category instances
 * @since 1.0.0
 */
export const Flattenable: flattenable.FlatMap<NonEmptyReadonlyArrayTypeLambda> = {
  map,
  flatMap
}

/**
 * Sequences the specified effect after this effect, but ignores the value
 * produced by the effect.
 *
 * @category sequencing
 * @since 1.0.0
 */
export const zipLeft: (
  second: NonEmptyReadonlyArray<unknown>
) => <A>(self: NonEmptyReadonlyArray<A>) => NonEmptyReadonlyArray<A> = flattenable.zipLeft(
  Flattenable
)

/**
 * A variant of `flatMap` that ignores the value produced by this effect.
 *
 * @category sequencing
 * @since 1.0.0
 */
export const zipRight: <A>(
  second: NonEmptyReadonlyArray<A>
) => (
  self: NonEmptyReadonlyArray<unknown>
) => NonEmptyReadonlyArray<A> = flattenable.zipRight(
  Flattenable
)

/**
 * @since 1.0.0
 */
export const ap: <A>(
  fa: NonEmptyReadonlyArray<A>
) => <B>(self: NonEmptyReadonlyArray<(a: A) => B>) => NonEmptyReadonlyArray<B> = (fa) =>
  (self) => pipe(self, flatMap((f) => pipe(fa, map((a) => f(a)))))

/**
 * @since 1.0.0
 */
export const extend = <A, B>(f: (as: NonEmptyReadonlyArray<A>) => B) =>
  (as: NonEmptyReadonlyArray<A>): NonEmptyReadonlyArray<B> => {
    let next: ReadonlyArray<A> = tail(as)
    const out: internal.NonEmptyArray<B> = [f(as)]
    while (internal.isNonEmpty(next)) {
      out.push(f(next))
      next = tail(next)
    }
    return out
  }

/**
 * @since 1.0.0
 */
export const duplicate: <A>(
  ma: NonEmptyReadonlyArray<A>
) => NonEmptyReadonlyArray<NonEmptyReadonlyArray<A>> = extend(identity)

/**
 * @since 1.0.0
 */
export const flatten: <A>(
  mma: NonEmptyReadonlyArray<NonEmptyReadonlyArray<A>>
) => NonEmptyReadonlyArray<A> = flatMap(identity)

/**
 * @since 1.0.0
 */
export const mapWithIndex: <A, B>(
  f: (i: number, a: A) => B
) => (fa: NonEmptyReadonlyArray<A>) => NonEmptyReadonlyArray<B> = <A, B>(
  f: (i: number, a: A) => B
) =>
  (as: NonEmptyReadonlyArray<A>): NonEmptyReadonlyArray<B> => {
    const out: internal.NonEmptyArray<B> = [f(0, head(as))]
    for (let i = 1; i < as.length; i++) {
      out.push(f(i, as[i]))
    }
    return out
  }

/**
 * @category traversing
 * @since 1.0.0
 */
export const traverseWithIndex = <F extends TypeLambda>(Apply: semigroupal.Semigroupal<F>) =>
  <A, S, R, O, E, B>(f: (i: number, a: A) => Kind<F, S, R, O, E, B>) => {
    const ap = semigroupal.ap(Apply)
    return (self: NonEmptyReadonlyArray<A>): Kind<F, S, R, O, E, NonEmptyReadonlyArray<B>> => {
      let out = pipe(f(0, head(self)), Apply.map(of))
      for (let i = 1; i < self.length; i++) {
        out = pipe(
          out,
          Apply.map((bs) => (b: B) => pipe(bs, append(b))),
          ap(f(i, self[i]))
        )
      }
      return out
    }
  }

/**
 * @category traversing
 * @since 1.0.0
 */
export const traverse = <F extends TypeLambda>(Semigroupal: semigroupal.Semigroupal<F>) =>
  <A, S, R, O, E, B>(
    f: (a: A) => Kind<F, S, R, O, E, B>
  ): ((self: NonEmptyReadonlyArray<A>) => Kind<F, S, R, O, E, NonEmptyReadonlyArray<B>>) =>
    traverseWithIndex(Semigroupal)((_, a) => f(a))

/**
 * @category traversing
 * @since 1.0.0
 */
export const sequence = <F extends TypeLambda>(
  Semigroupal: semigroupal.Semigroupal<F>
): (<S, R, O, E, A>(
  self: NonEmptyReadonlyArray<Kind<F, S, R, O, E, A>>
) => Kind<F, S, R, O, E, NonEmptyReadonlyArray<A>>) => traverse(Semigroupal)(identity)

/**
 * @since 1.0.0
 */
export const extract: <A>(self: NonEmptyReadonlyArray<A>) => A = internal.head

// -------------------------------------------------------------------------------------
// type lambdas
// -------------------------------------------------------------------------------------

/**
 * @category type lambdas
 * @since 1.0.0
 */
export interface NonEmptyReadonlyArrayTypeLambda extends TypeLambda {
  readonly type: NonEmptyReadonlyArray<this["Out1"]>
}

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

/**
 * @category instances
 * @since 1.0.0
 */
export declare const getSemigroup: <A>() => Semigroup<NonEmptyReadonlyArray<A>>

/**
 * @since 1.0.0
 */
export declare const getUnionSemigroup: <A>() => Semigroup<NonEmptyReadonlyArray<A>>

/**
 * @category instances
 * @since 1.0.0
 */
export const Functor: functor.Functor<NonEmptyReadonlyArrayTypeLambda> = {
  map
}

/**
 * @category mapping
 * @since 1.0.0
 */
export const flap: <A>(
  a: A
) => <B>(fab: NonEmptyReadonlyArray<(a: A) => B>) => NonEmptyReadonlyArray<B> = functor.flap(
  Functor
)

/**
 * Maps the success value of this effect to the specified constant value.
 *
 * @category mapping
 * @since 1.0.0
 */
export const as: <B>(b: B) => (self: NonEmptyReadonlyArray<unknown>) => NonEmptyReadonlyArray<B> =
  functor.as(Functor)

/**
 * Returns the effect resulting from mapping the success of this effect to unit.
 *
 * @category mapping
 * @since 1.0.0
 */
export const unit: (self: NonEmptyReadonlyArray<unknown>) => NonEmptyReadonlyArray<void> = functor
  .unit(Functor)

/**
 * @category instances
 * @since 1.0.0
 */
export const Apply: semigroupal.Semigroupal<NonEmptyReadonlyArrayTypeLambda> = {
  map,
  zipWith,
  zipMany: <A>(
    others: Iterable<readonly [A, ...Array<A>]>
  ) =>
    (start: readonly [A, ...Array<A>]): readonly [[A, ...Array<A>], ...Array<[A, ...Array<A>]>] => {
      let c: readonly [[A, ...Array<A>], ...Array<[A, ...Array<A>]>] = pipe(start, map((a) => [a]))
      for (const o of others) {
        c = pipe(c, zipWith(o, (a, b) => [...a, b]))
      }
      return c
    }
}

/**
 * Lifts a binary function into `NonEmptyReadonlyArray`.
 *
 * @category lifting
 * @since 1.0.0
 */
export const lift2: <A, B, C>(
  f: (a: A, b: B) => C
) => (fa: NonEmptyReadonlyArray<A>, fb: NonEmptyReadonlyArray<B>) => NonEmptyReadonlyArray<C> =
  semigroupal.lift2(Apply)

/**
 * Lifts a ternary function into `NonEmptyReadonlyArray`.
 *
 * @category lifting
 * @since 1.0.0
 */
export const lift3: <A, B, C, D>(
  f: (a: A, b: B, c: C) => D
) => (
  fa: NonEmptyReadonlyArray<A>,
  fb: NonEmptyReadonlyArray<B>,
  fc: NonEmptyReadonlyArray<C>
) => NonEmptyReadonlyArray<D> = semigroupal.lift3(Apply)

/**
 * @category instances
 * @since 1.0.0
 */
export const Applicative: monoidal.Monoidal<NonEmptyReadonlyArrayTypeLambda> = {
  map,
  of,
  zipMany: Apply.zipMany,
  zipWith: Apply.zipWith,
  zipAll: <A>(
    all: Iterable<readonly [A, ...Array<A>]>
  ): readonly [ReadonlyArray<A>, ...Array<ReadonlyArray<A>>] => {
    let c: readonly [ReadonlyArray<A>, ...Array<ReadonlyArray<A>>] = [[], ...[]]
    for (const o of all) {
      c = pipe(c, zipWith(o, (a, b) => [...a, b]))
    }
    return c
  }
}

/**
 * @category instances
 * @since 1.0.0
 */
export const Monad: monad.Monad<NonEmptyReadonlyArrayTypeLambda> = {
  map,
  of,
  flatMap
}

/**
 * Returns an effect that effectfully "peeks" at the success of this effect.
 *
 * @exampleTodo
 * import * as RA from '@fp-ts/core/data/ReadonlyArray'
 * import { pipe } from '@fp-ts/core/data/Function'
 *
 * assert.deepStrictEqual(
 *   pipe(
 *     [1, 2, 3],
 *     RA.tap(() => ['a', 'b'])
 *   ),
 *   [1, 1, 2, 2, 3, 3]
 * )
 *
 * @since 1.0.0
 */
export const tap: <A>(
  f: (a: A) => NonEmptyReadonlyArray<unknown>
) => (self: NonEmptyReadonlyArray<A>) => NonEmptyReadonlyArray<A> = flattenable.tap(Flattenable)

/**
 * @category folding
 * @since 1.0.0
 */
export const reduce = <B, A>(b: B, f: (b: B, a: A) => B) =>
  (self: NonEmptyReadonlyArray<A>): B => self.reduce((b, a) => f(b, a), b)

/**
 * **Note**. The constraint is relaxed: a `Semigroup` instead of a `Monoid`.
 *
 * @category folding
 * @since 1.0.0
 */
export const foldMap = <S>(S: Semigroup<S>) =>
  <A>(f: (a: A) => S) =>
    (self: NonEmptyReadonlyArray<A>): S =>
      self.slice(1).reduce((s, a) => S.combine(f(a))(s), f(self[0]))

/**
 * @category folding
 * @since 1.0.0
 */
export const reduceRight = <B, A>(b: B, f: (a: A, b: B) => B) =>
  (self: NonEmptyReadonlyArray<A>): B => self.reduceRight((b, a) => f(a, b), b)

/**
 * @category folding
 * @since 1.0.0
 */
export const reduceWithIndex = <B, A>(b: B, f: (i: number, b: B, a: A) => B) =>
  (self: NonEmptyReadonlyArray<A>): B => self.reduce((b, a, i) => f(i, b, a), b)

/**
 * **Note**. The constraint is relaxed: a `Semigroup` instead of a `Monoid`.
 *
 * @category folding
 * @since 1.0.0
 */
export const foldMapWithIndex = <S>(S: Semigroup<S>) =>
  <A>(f: (i: number, a: A) => S) =>
    (self: NonEmptyReadonlyArray<A>): S =>
      self.slice(1).reduce((s, a, i) => S.combine(f(i + 1, a))(s), f(0, self[0]))

/**
 * @category folding
 * @since 1.0.0
 */
export const reduceRightWithIndex = <B, A>(b: B, f: (i: number, a: A, b: B) => B) =>
  (self: NonEmptyReadonlyArray<A>): B => self.reduceRight((b, a, i) => f(i, a, b), b)

/**
 * @category folding
 * @since 1.0.0
 */
export const reduceKind = <F extends TypeLambda>(Flattenable: flattenable.FlatMap<F>) =>
  <S, R, O, E, B, A>(
    fb: Kind<F, S, R, O, E, B>,
    f: (b: B, a: A) => Kind<F, S, R, O, E, B>
  ): ((self: NonEmptyReadonlyArray<A>) => Kind<F, S, R, O, E, B>) =>
    reduce(fb, (fb, a) =>
      pipe(
        fb,
        Flattenable.flatMap((b) => f(b, a))
      ))

/**
 * @category instances
 * @since 1.0.0
 */
export const Traversable: traversable.Traversable<NonEmptyReadonlyArrayTypeLambda> = {
  traverse
}

/**
 * @category instances
 * @since 1.0.0
 */
export const Comonad: comonad.Comonad<NonEmptyReadonlyArrayTypeLambda> = {
  map,
  extend,
  extract
}

// -------------------------------------------------------------------------------------
// do notation
// -------------------------------------------------------------------------------------

/**
 * @category do notation
 * @since 1.0.0
 */
export const Do: NonEmptyReadonlyArray<{}> = of(internal.Do)

/**
 * @category do notation
 * @since 1.0.0
 */
export const bindTo: <N extends string>(
  name: N
) => <A>(self: NonEmptyReadonlyArray<A>) => NonEmptyReadonlyArray<{ readonly [K in N]: A }> =
  functor.bindTo(Functor)

const let_: <N extends string, A extends object, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => B
) => (
  self: NonEmptyReadonlyArray<A>
) => NonEmptyReadonlyArray<{ readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }> = functor
  .let(Functor)

export {
  /**
   * @category do notation
   * @since 1.0.0
   */
  let_ as let
}

/**
 * @category do notation
 * @since 1.0.0
 */
export const bind: <N extends string, A extends object, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => NonEmptyReadonlyArray<B>
) => (
  self: NonEmptyReadonlyArray<A>
) => NonEmptyReadonlyArray<{ readonly [K in keyof A | N]: K extends keyof A ? A[K] : B }> =
  flattenable.bind(Flattenable)

/**
 * A variant of `bind` that sequentially ignores the scope.
 *
 * @category do notation
 * @since 1.0.0
 */
export const bindRight: <N extends string, A extends object, B>(
  name: Exclude<N, keyof A>,
  fb: NonEmptyReadonlyArray<B>
) => (
  self: NonEmptyReadonlyArray<A>
) => NonEmptyReadonlyArray<{ readonly [K in keyof A | N]: K extends keyof A ? A[K] : B }> =
  semigroupal
    .bindRight(Apply)

// -------------------------------------------------------------------------------------
// tuple sequencing
// -------------------------------------------------------------------------------------

/**
 * @category tuple sequencing
 * @since 1.0.0
 */
export const Zip: NonEmptyReadonlyArray<readonly []> = of(internal.empty)

/**
 * @category tuple sequencing
 * @since 1.0.0
 */
export const tupled: <A>(self: NonEmptyReadonlyArray<A>) => NonEmptyReadonlyArray<readonly [A]> =
  functor.tupled(Functor)

/**
 * Sequentially zips this effect with the specified effect.
 *
 * @category tuple sequencing
 * @since 1.0.0
 */
export const zipFlatten: <B>(
  fb: NonEmptyReadonlyArray<B>
) => <A extends ReadonlyArray<unknown>>(
  self: NonEmptyReadonlyArray<A>
) => NonEmptyReadonlyArray<readonly [...A, B]> = semigroupal.zipFlatten(Apply)

/**
 * @since 1.0.0
 */
export const head: <A>(as: NonEmptyReadonlyArray<A>) => A = extract

/**
 * @since 1.0.0
 */
export const tail: <A>(as: NonEmptyReadonlyArray<A>) => ReadonlyArray<A> = internal.tail

/**
 * @since 1.0.0
 */
export const last = <A>(as: NonEmptyReadonlyArray<A>): A => as[as.length - 1]

/**
 * Get all but the last element of a non empty array, creating a new array.
 *
 * @exampleTodo
 * import { init } from '@fp-ts/core/data/NonEmptyReadonlyArray'
 *
 * assert.deepStrictEqual(init([1, 2, 3]), [1, 2])
 * assert.deepStrictEqual(init([1]), [])
 *
 * @since 1.0.0
 */
export const init = <A>(as: NonEmptyReadonlyArray<A>): ReadonlyArray<A> => as.slice(0, -1)

/**
 * @since 1.0.0
 */
export const min = <A>(O: Sortable<A>): ((as: NonEmptyReadonlyArray<A>) => A) => {
  const S = semigroup.min(O)
  return (nea) => nea.reduce((a, acc) => S.combine(acc)(a))
}

/**
 * @since 1.0.0
 */
export const max = <A>(O: Sortable<A>): ((as: NonEmptyReadonlyArray<A>) => A) => {
  const S = semigroup.max(O)
  return (nea) => nea.reduce((a, acc) => S.combine(acc)(a))
}

/**
 * @since 1.0.0
 */
export const combineAll = <A>(S: Semigroup<A>) =>
  (fa: NonEmptyReadonlyArray<A>): A => fa.reduce((a, acc) => S.combine(acc)(a))
