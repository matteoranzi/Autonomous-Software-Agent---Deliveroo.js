(define (domain default)

(:requirements
    :strips
    :typing
    :numeric-fluents
)

(:types
    sokoban crate - locatable
    locatable
    tile
)

(:functions
    (total-distance)
)

(:predicates
    (adjacent-up ?tileA - tile ?tileB - tile)
    (adjacent-down ?tileA - tile ?tileB - tile)
    (adjacent-left ?tileA - tile ?tileB - tile)
    (adjacent-right ?tileA - tile ?tileB - tile)

    (free-tile ?tile - tile)
    (crates-allowed-tile ?tile - tile)

    (on ?obj - locatable ?tile - tile)
)

; ================================================
; SOKOBAN MOVES
; ================================================
(:action move-up
    :parameters (
        ?sokoban - sokoban
        ?fromTile - tile
        ?toTile - tile
    )
    :precondition (and
        (free-tile ?toTile)
        (adjacent-up ?fromTile ?toTile)
        (on ?sokoban ?fromTile)
    )
    :effect (and
        (free-tile ?fromTile)
        (not (on ?sokoban ?fromTile))

        (not (free-tile ?toTile))
        (on ?sokoban ?toTile)

        (increase (total-distance) 1)
    )
)

(:action move-down
    :parameters (
        ?sokoban - sokoban
        ?fromTile - tile
        ?toTile - tile
    )
    :precondition (and
        (free-tile ?toTile)
        (adjacent-down ?fromTile ?toTile)
        (on ?sokoban ?fromTile)
    )
    :effect (and
        (free-tile ?fromTile)
        (not (on ?sokoban ?fromTile))

        (not (free-tile ?toTile))
        (on ?sokoban ?toTile)

        (increase (total-distance) 1)
    )
)

(:action move-left
    :parameters (
        ?sokoban - sokoban
        ?fromTile - tile
        ?toTile - tile
    )
    :precondition (and
        (free-tile ?toTile)
        (adjacent-left ?fromTile ?toTile)
        (on ?sokoban ?fromTile)
    )
    :effect (and
        (free-tile ?fromTile)
        (not (on ?sokoban ?fromTile))

        (not (free-tile ?toTile))
        (on ?sokoban ?toTile)

        (increase (total-distance) 1)
    )
)

(:action move-right
    :parameters (
        ?sokoban - sokoban
        ?fromTile - tile
        ?toTile - tile
    )
    :precondition (and
        (free-tile ?toTile)
        (adjacent-right ?fromTile ?toTile)
        (on ?sokoban ?fromTile)
    )
    :effect (and
        (free-tile ?fromTile)
        (not (on ?sokoban ?fromTile))

        (not (free-tile ?toTile))
        (on ?sokoban ?toTile)

        (increase (total-distance) 1)
    )
)


; ================================================
; PUSH CRATES
; ================================================
(:action push-up
    :parameters (
        ?sokoban - sokoban
        ?crate - crate
        ?sokobanFromTile - tile
        ?crateFromTile - tile
        ?crateToTile - tile
    )
    :precondition (and
        (on ?sokoban ?sokobanFromTile)
        (on ?crate ?crateFromTile)

        (adjacent-up ?sokobanFromTile ?crateFromTile)
        (adjacent-up ?crateFromTile ?crateToTile)

        (free-tile ?crateToTile)
        (crates-allowed-tile ?crateToTile)
    )
    :effect (and
        (free-tile ?sokobanFromTile)
        (not (on ?sokoban ?sokobanFromTile))
        (not (on ?crate ?crateFromTile))

        (not (free-tile ?crateToTile))
        (on ?sokoban ?crateFromTile)
        (on ?crate ?crateToTile)

        (increase (total-distance) 1)
    )
)

(:action push-down
    :parameters (
        ?sokoban - sokoban
        ?crate - crate
        ?sokobanFromTile - tile
        ?crateFromTile - tile
        ?crateToTile - tile
    )
    :precondition (and
        (on ?sokoban ?sokobanFromTile)
        (on ?crate ?crateFromTile)

        (adjacent-down ?sokobanFromTile ?crateFromTile)
        (adjacent-down ?crateFromTile ?crateToTile)

        (free-tile ?crateToTile)
        (crates-allowed-tile ?crateToTile)
    )
    :effect (and
        (free-tile ?sokobanFromTile)
        (not (on ?sokoban ?sokobanFromTile))
        (not (on ?crate ?crateFromTile))

        (not (free-tile ?crateToTile))
        (on ?sokoban ?crateFromTile)
        (on ?crate ?crateToTile)

        (increase (total-distance) 1)
    )
)

(:action push-left
    :parameters (
        ?sokoban - sokoban
        ?crate - crate
        ?sokobanFromTile - tile
        ?crateFromTile - tile
        ?crateToTile - tile
    )
    :precondition (and
        (on ?sokoban ?sokobanFromTile)
        (on ?crate ?crateFromTile)

        (adjacent-left ?sokobanFromTile ?crateFromTile)
        (adjacent-left ?crateFromTile ?crateToTile)

        (free-tile ?crateToTile)
        (crates-allowed-tile ?crateToTile)
    )
    :effect (and
        (free-tile ?sokobanFromTile)
        (not (on ?sokoban ?sokobanFromTile))
        (not (on ?crate ?crateFromTile))

        (not (free-tile ?crateToTile))
        (on ?sokoban ?crateFromTile)
        (on ?crate ?crateToTile)

        (increase (total-distance) 1)
    )
)

(:action push-right
    :parameters (
        ?sokoban - sokoban
        ?crate - crate
        ?sokobanFromTile - tile
        ?crateFromTile - tile
        ?crateToTile - tile
    )
    :precondition (and
        (on ?sokoban ?sokobanFromTile)
        (on ?crate ?crateFromTile)

        (adjacent-right ?sokobanFromTile ?crateFromTile)
        (adjacent-right ?crateFromTile ?crateToTile)

        (free-tile ?crateToTile)
        (crates-allowed-tile ?crateToTile)
    )
    :effect (and
        (free-tile ?sokobanFromTile)
        (not (on ?sokoban ?sokobanFromTile))
        (not (on ?crate ?crateFromTile))

        (not (free-tile ?crateToTile))
        (on ?sokoban ?crateFromTile)
        (on ?crate ?crateToTile)

        (increase (total-distance) 1)
    )
)
)
