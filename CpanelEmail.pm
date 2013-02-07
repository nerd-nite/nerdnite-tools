#!/usr/bin/env perl
package CpanelEmail;
use strict;
use warnings;
use cPanel::PublicAPI;
use JSON;
use Carp;
use Readonly;
use Data::Dumper;

sub new {
    my $class = shift || croak 'Incorrect attempt to instantiate CpanelEmail';
    my $debug = shift || 0;
    my $self = {};

    $self->{cp} = cPanel::PublicAPI->new(
            'user'   => 'nerdnite',
            'pass'   => 's4tgd1tw',
            'host'   => 'lizziebracken.com',
            'usessl' => 1,
            'debug'  => $debug,
        ) || croak "Could not create cPanel connection: $!";

    $self->{json} = JSON->new->allow_nonref;

    bless $self => $class;
    return $self;
}

sub request {
    my $self     = shift;
    my $function = shift || carp "Must provide a function name to `request`";
    my $params   = shift || {};

    my $result = $self->{cp}->cpanel_api2_request(
        'cpanel',
        {
            'module' => 'Email',
            'func'   => $function,
        },
        $params, 'json'
    );
    return $self->{json}->decode($result)->{cpanelresult}->{data};
}

1;