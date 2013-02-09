#!/usr/bin/env perl
package NerdNite::Email;
use strict;
use warnings;
use cPanel::PublicAPI;
use JSON;
use Carp;
use Readonly;
use Data::Dumper;
use Underscore;

Readonly my $DOMAIN => 'nerdnite.com';

sub new {
    my $class = shift || croak 'Incorrect attempt to instantiate NerdNite::Email';
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

sub api1_request {
     my $self     = shift;
     my $function = shift || carp "Must provide a function name to `request`";
     my $params   = shift || [];

     my $result = $self->{cp}->cpanel_api1_request(
         'cpanel',
         {
             'module' => 'Email',
             'func'   => $function,
         },
         $params, 'json'
     );
     return $self->{json}->decode($result);
}

sub addForward {
    my $self   = shift;
    my $source = shift || carp "Please provide a source email to addForward";
    my $target = shift || carp "Please provide a target email to addForward";

    my $nerdniter = '';

    if($source =~ qr(([^\@]+)(?:\@$DOMAIN)?)) {
        $nerdniter = $1;
    }
    else {
        carp "Must provide a nerdnite name or a nerdnite email";
    }

    my $params = {
        domain      => 'nerdnite.com',
        email       => $nerdniter,
        fwdopt      => 'fwd',
        fwdemail    => $target
    };
    return $self->request('addforward', $params);
}

sub getAllEmails {
    my $self = shift;
    my $pops     = $self->request('listpops');
    my $forwards = $self->request('listforwards');

    my $emails = _->union(_->pluck($pops, 'email'), _->pluck($forwards, 'dest'));
    return _->sort($emails);
}
1;
