/**
 * The `FromResult` type class represents those data types which support typed errors.
 *
 * @since 1.0.0
 */
import type { FlatMap } from "@fp-ts/core/FlatMap"
import type { Kind, TypeClass, TypeLambda } from "@fp-ts/core/HKT"
import { flow, pipe } from "@fp-ts/data/Function"
import * as C from "@fp-ts/data/internal/Common"
import type * as O from "@fp-ts/data/Option"
import { not } from "@fp-ts/data/Predicate"
import type { Predicate } from "@fp-ts/data/Predicate"
import type { Refinement } from "@fp-ts/data/Refinement"
import type * as R from "@fp-ts/data/Result"

/**
 * @category models
 * @since 1.0.0
 */
export interface FromResult<F extends TypeLambda> extends TypeClass<F> {
  readonly fromResult: <E, A, S>(fa: R.Result<E, A>) => Kind<F, S, unknown, never, E, A>
}

/**
 * @category conversions
 * @since 1.0.0
 */
export const fromOption = <F extends TypeLambda>(FromResult: FromResult<F>) =>
  <E>(onNone: E) =>
    <A, S>(self: O.Option<A>): Kind<F, S, unknown, never, E, A> =>
      FromResult.fromResult(C.fromOptionToResult(onNone)(self))

/**
 * @category conversions
 * @since 1.0.0
 */
export const fromNullable = <F extends TypeLambda>(FromResult: FromResult<F>) =>
  <E>(onNullable: E) =>
    <A, S>(a: A): Kind<F, S, unknown, never, E, NonNullable<A>> =>
      FromResult.fromResult(C.fromNullableToResult(onNullable)(a))

// -------------------------------------------------------------------------------------
// lifting
// -------------------------------------------------------------------------------------

/**
 * @category lifting
 * @since 1.0.0
 */
export const liftPredicate: <F extends TypeLambda>(
  FromResult: FromResult<F>
) => {
  <C extends A, B extends A, E, A = C>(refinement: Refinement<A, B>, onFalse: E): <S>(
    c: C
  ) => Kind<F, S, unknown, never, E, B>
  <B extends A, E, A = B>(
    predicate: Predicate<A>,
    onFalse: E
  ): <S>(b: B) => Kind<F, S, unknown, never, E, B>
} = <F extends TypeLambda>(FromResult: FromResult<F>) =>
  <B extends A, E, A = B>(predicate: Predicate<A>, onFalse: E) =>
    <S>(b: B): Kind<F, S, unknown, never, E, B> =>
      FromResult.fromResult(predicate(b) ? C.succeed(b) : C.fail(onFalse))

/**
 * @category lifting
 * @since 1.0.0
 */
export const liftNullable = <F extends TypeLambda>(FromResult: FromResult<F>) => {
  const fromNullable_ = fromNullable(FromResult)
  return <A extends ReadonlyArray<unknown>, B, E>(
    f: (...a: A) => B | null | undefined,
    onNullable: E
  ) => {
    const from = fromNullable_(onNullable)
    return <S>(...a: A): Kind<F, S, unknown, never, E, NonNullable<B>> => from(f(...a))
  }
}

/**
 * @category lifting
 * @since 1.0.0
 */
export const liftOption = <F extends TypeLambda>(FromResult: FromResult<F>) => {
  return <A extends ReadonlyArray<unknown>, B, E>(f: (...a: A) => O.Option<B>, onNone: E) => {
    const fromOption = C.fromOptionToResult(onNone)
    return <S>(...a: A): Kind<F, S, unknown, never, E, B> =>
      FromResult.fromResult(fromOption(f(...a)))
  }
}

/**
 * @category lifting
 * @since 1.0.0
 */
export const liftResult = <F extends TypeLambda>(FromResult: FromResult<F>) =>
  <A extends ReadonlyArray<unknown>, E, B>(f: (...a: A) => R.Result<E, B>) =>
    <S>(...a: A): Kind<F, S, unknown, never, E, B> => FromResult.fromResult(f(...a))

// -------------------------------------------------------------------------------------
// sequencing
// -------------------------------------------------------------------------------------

/**
 * @category sequencing
 * @since 1.0.0
 */
export const flatMapNullable = <M extends TypeLambda>(
  FromResult: FromResult<M>,
  Flattenable: FlatMap<M>
) => {
  const liftNullable_ = liftNullable(FromResult)
  return <A, B, E2>(f: (a: A) => B | null | undefined, onNullable: E2) => {
    const lift = liftNullable_(f, onNullable)
    return <S, R, O, E1>(
      self: Kind<M, S, R, O, E1, A>
    ): Kind<M, S, R, O, E1 | E2, NonNullable<B>> =>
      pipe(self, Flattenable.flatMap<A, S, R, O, E2, NonNullable<B>>(lift))
  }
}

/**
 * @category sequencing
 * @since 1.0.0
 */
export const flatMapOption = <F extends TypeLambda>(
  FromResult: FromResult<F>,
  Flattenable: FlatMap<F>
) => {
  const liftOption_ = liftOption(FromResult)
  return <A, B, E2>(f: (a: A) => O.Option<B>, onNone: E2) => {
    const lift = liftOption_(f, onNone)
    return <S, R, O, E1>(self: Kind<F, S, R, O, E1, A>): Kind<F, S, R, O, E1 | E2, B> => {
      return pipe(self, Flattenable.flatMap<A, S, R, O, E2, B>(lift))
    }
  }
}

/**
 * @category sequencing
 * @since 1.0.0
 */
export const flatMapResult = <M extends TypeLambda>(
  FromResult: FromResult<M>,
  Flattenable: FlatMap<M>
) => {
  const liftResult_ = liftResult(FromResult)
  return <A, E2, B>(f: (a: A) => R.Result<E2, B>) =>
    <S, R, O, E1>(self: Kind<M, S, R, O, E1, A>): Kind<M, S, R, O, E1 | E2, B> => {
      return pipe(self, Flattenable.flatMap<A, S, R, O, E1 | E2, B>(liftResult_(f)))
    }
}

// -------------------------------------------------------------------------------------
// filtering
// -------------------------------------------------------------------------------------

// TODO
// /**
//  * @category filtering
//  * @since 1.0.0
//  */
// export const compact =
//   <F extends TypeLambda>(F: FromResult<F>, M: Flattenable<F>) =>
//   <S, R, O, E, A>(self: Kind<F, S, R, O, E, Option<A>>): Kind<F, S, R, O, E, A> => {
//     return null as any
//   }

/**
 * @category filtering
 * @since 1.0.0
 */
export const filterMap = <F extends TypeLambda>(
  FromResult: FromResult<F>,
  Flattenable: FlatMap<F>
) =>
  <A, B, E>(
    f: (a: A) => O.Option<B>,
    onNone: E
  ): (<S, R, O>(self: Kind<F, S, R, O, E, A>) => Kind<F, S, R, O, E, B>) =>
    Flattenable.flatMap((a) => {
      const ob = f(a)
      return FromResult.fromResult(C.isNone(ob) ? C.fail(onNone) : C.succeed(ob.value))
    })

/**
 * @category filtering
 * @since 1.0.0
 */
export const partitionMap = <F extends TypeLambda>(
  FromResult: FromResult<F>,
  Flattenable: FlatMap<F>
) =>
  <A, B, C, E>(f: (a: A) => R.Result<B, C>, onEmpty: E) =>
    <S, R, O>(
      self: Kind<F, S, R, O, E, A>
    ): readonly [Kind<F, S, R, O, E, B>, Kind<F, S, R, O, E, C>] => {
      const filterMapFM = filterMap(FromResult, Flattenable)
      return [
        pipe(self, filterMapFM(flow(f, C.getFailure), onEmpty)),
        pipe(self, filterMapFM(flow(f, C.getSuccess), onEmpty))
      ]
    }

/**
 * @category filtering
 * @since 1.0.0
 */
export const filter = <F extends TypeLambda>(
  FromResult: FromResult<F>,
  Flattenable: FlatMap<F>
): {
  <C extends A, B extends A, E2, A = C>(refinement: Refinement<A, B>, onFalse: E2): <S, R, O, E1>(
    self: Kind<F, S, R, O, E1, C>
  ) => Kind<F, S, R, O, E1 | E2, B>
  <B extends A, E2, A = B>(predicate: Predicate<A>, onFalse: E2): <S, R, O, E1>(
    self: Kind<F, S, R, O, E1, B>
  ) => Kind<F, S, R, O, E1 | E2, B>
} =>
  <B extends A, E2, A = B>(
    predicate: Predicate<A>,
    onFalse: E2
  ): (<S, R, O, E1>(mb: Kind<F, S, R, O, E1, B>) => Kind<F, S, R, O, E1 | E2, B>) =>
    Flattenable.flatMap((b) => FromResult.fromResult(predicate(b) ? C.succeed(b) : C.fail(onFalse)))

/**
 * @category filtering
 * @since 1.0.0
 */
export const partition = <F extends TypeLambda>(
  FromResult: FromResult<F>,
  Flattenable: FlatMap<F>
): {
  <C extends A, B extends A, E, A = C>(refinement: Refinement<A, B>, onFalse: E): <S, R, O>(
    self: Kind<F, S, R, O, E, C>
  ) => readonly [Kind<F, S, R, O, E, C>, Kind<F, S, R, O, E, B>]
  <B extends A, E, A = B>(predicate: Predicate<A>, onFalse: E): <S, R, O>(
    self: Kind<F, S, R, O, E, B>
  ) => readonly [Kind<F, S, R, O, E, B>, Kind<F, S, R, O, E, B>]
} =>
  <B extends A, E, A = B>(predicate: Predicate<A>, onFalse: E) =>
    <S, R, O>(
      self: Kind<F, S, R, O, E, B>
    ): readonly [Kind<F, S, R, O, E, B>, Kind<F, S, R, O, E, B>] => {
      const filter_ = filter(FromResult, Flattenable)
      return [
        pipe(self, filter_(not(predicate), onFalse)),
        pipe(self, filter_(predicate, onFalse))
      ]
    }
